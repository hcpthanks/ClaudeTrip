#!/usr/bin/env node
/**
 * Sentinel Timing Hook — PostToolUse hook
 *
 * Detects:
 *   Type 4: Timing anomalies — tool execution time > historical median × 3
 *   Type 6: Silence periods    — no tool result for ≥ 60s
 *
 * Uses sentinel-state.json as the data bus, shared with:
 *   - ecc-context-monitor.js (loop detection)
 *   - sentinel Agent (future P1 — semantic analysis)
 *
 * Hook ID : post:sentinel-timing
 * Profiles: standard, strict
 */

'use strict';

const {
  getSessionState,
  saveSessionState,
  appendSentinelLog,
  checkTimingAnomaly,
  checkAlertLimit,
  classifySeverity,
  TIMING_MIN_ABSOLUTE_MS,
  SILENCE_THRESHOLD_MS
} = require('../lib/sentinel-state');

const { sanitizeSessionId } = require('../lib/session-bridge');

/**
 * Check if the tool_input contains a timing entry (from pre-bash hooks).
 * Returns the start time in ms if available, otherwise null.
 */
function extractTimingMs(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null;

  // Some hook patterns embed a __timing_start field
  if (typeof toolInput.__timing_start === 'number') return toolInput.__timing_start;
  if (typeof toolInput._timingStart === 'number') return toolInput._timingStart;

  return null;
}

/**
 * Estimate execution duration from tool_use timestamp.
 * Falls back to heuristic based on command content.
 *
 * @param {object} input - the full PostToolUse hook input
 * @returns {{ durationMs: number, timingSource: string }}
 */
function estimateDuration(input) {
  const toolResult = input.tool_result || {};

  // If we have explicit timing metadata
  if (typeof toolResult.duration_ms === 'number') {
    return { durationMs: toolResult.duration_ms, timingSource: 'explicit' };
  }
  if (typeof toolResult.durationMs === 'number') {
    return { durationMs: toolResult.durationMs, timingSource: 'explicit' };
  }

  // If we can calculate from tool_use timestamp
  const toolUseTs = input.tool_use_timestamp || input.timestamp;
  if (toolUseTs) {
    const startMs = new Date(toolUseTs).getTime();
    const endMs = Date.now();
    const durationMs = endMs - startMs;
    // Only trust timestamps if the duration is positive and not absurd
    if (durationMs > 0 && durationMs < 3600000) { // < 1 hour
      return { durationMs, timingSource: 'timestamp_diff' };
    }
  }

  return { durationMs: 0, timingSource: 'unknown' };
}

/**
 * Format duration for human-readable output.
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m${secs}s`;
}

/**
 * Build sentinel warning message for timing anomaly.
 */
function buildTimingWarning(details, command) {
  const cmdShort = command.length > 80
    ? command.slice(0, 80) + '...'
    : command;
  return `[哨兵 Type4] TIMING ANOMALY: \`${cmdShort}\` took ${formatDuration(details.durationMs)} — ` +
    `${details.ratio.toFixed(1)}× the historical median (${formatDuration(details.baselineMs)}). ` +
    'This may indicate a hung command or unexpected behavior.';
}

/**
 * Build sentinel warning message for silence detection.
 */
function buildSilenceWarning(silenceMs) {
  return `[哨兵 Type6] SILENCE WARNING: No tool output for ${formatDuration(silenceMs)}. ` +
    'The operation may be stuck or the agent may have stopped responding.';
}

/**
 * Predefined list of commands expected to be long-running.
 * Timing anomalies from these are downgraded to SILENT (log only).
 */
const LONG_RUNNING_PREFIXES = [
  'npm install', 'pip install', 'pip3 install', 'pnpm install', 'yarn install',
  'cargo build', 'cargo install',
  'npx hyperframes render', 'npx hyperframes',
  'ffmpeg',
  'git clone',
  'docker build', 'docker pull', 'docker compose',
  'wget', 'curl -O',
  'python -m pip install',
  'winget install', 'choco install',
  'npx framepack create',
  'gh release download',
];

function isLongRunning(command) {
  if (!command || typeof command !== 'string') return false;
  const trimmed = command.trim();
  for (const prefix of LONG_RUNNING_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * @param {string} rawInput - Raw JSON string from stdin
 * @returns {string} JSON output with additionalContext or pass-through
 */
function run(rawInput) {
  try {
    const input = rawInput.trim() ? JSON.parse(rawInput) : {};

    const sessionId = sanitizeSessionId(input.session_id) ||
      sanitizeSessionId(process.env.ECC_SESSION_ID) ||
      sanitizeSessionId(process.env.CLAUDE_SESSION_ID);

    if (!sessionId) return rawInput;

    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';

    // Only meaningful for Bash tools and Agent spawns (measurable duration)
    if (toolName !== 'Bash' && toolName !== 'Agent' && toolName !== 'Task') {
      return rawInput;
    }

    const sessionState = getSessionState(sessionId);
    const now = Date.now();

    // ── Type 6: Silence Detection ──────────────────────────────────
    const lastResultAt = sessionState.last_tool_result_at || now;
    const silenceMs = now - lastResultAt;

    let silenceWarning = null;
    if (silenceMs >= SILENCE_THRESHOLD_MS) {
      const sev = classifySeverity('type6_silence', { durationMs: silenceMs });
      const limit = checkAlertLimit(sessionState, 'type6_silence', sev);
      if (limit.shouldEmit) {
        silenceWarning = buildSilenceWarning(silenceMs);
        appendSentinelLog({
          signal_type: 'type6_silence',
          severity: sev,
          description: silenceWarning,
          context: { session_id: sessionId, silence_ms: silenceMs }
        });
      }
    }

    // ── Type 4: Timing Anomaly Detection ────────────────────────────
    const { durationMs, timingSource } = estimateDuration(input);

    let timingWarning = null;
    if (durationMs >= TIMING_MIN_ABSOLUTE_MS && timingSource !== 'unknown') {
      sessionState.timing_baselines = sessionState.timing_baselines || {};
      const anomaly = checkTimingAnomaly(sessionState.timing_baselines, command, durationMs);

      if (anomaly.isAnomaly && !isLongRunning(command)) {
        const sev = classifySeverity('type4_timing', {
          ratio: anomaly.ratio,
          durationMs
        });
        const limit = checkAlertLimit(sessionState, 'type4_timing', sev);
        if (limit.shouldEmit) {
          timingWarning = buildTimingWarning(
            { durationMs, baselineMs: anomaly.baselineMs, ratio: anomaly.ratio },
            command
          );
          appendSentinelLog({
            signal_type: 'type4_timing',
            severity: sev,
            description: timingWarning,
            context: {
              session_id: sessionId,
              command,
              duration_ms: durationMs,
              baseline_ms: anomaly.baselineMs,
              ratio: anomaly.ratio
            }
          });
        }
      }
    }

    // Update last tool result timestamp
    sessionState.last_tool_result_at = now;
    saveSessionState(sessionId, sessionState);

    // Build additional context message
    const messages = [];
    if (silenceWarning) messages.push(silenceWarning);
    if (timingWarning) messages.push(timingWarning);

    if (messages.length === 0) return rawInput;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: messages.join('\n')
      }
    };

    return JSON.stringify(output);
  } catch (err) {
    // Never block tool execution
    if (process.env.ECC_DEBUG_SENTINEL) {
      process.stderr.write(`[SentinelTiming] Error: ${err.message}\n`);
    }
    return rawInput;
  }
}

module.exports = { run };

if (require.main === module) {
  let data = '';
  const MAX_STDIN = 1024 * 1024;
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
  });
  process.stdin.on('end', () => {
    process.stdout.write(run(data));
    process.exit(0);
  });
}
