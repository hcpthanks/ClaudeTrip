#!/usr/bin/env node
/**
 * ECC Context Monitor — PostToolUse hook
 *
 * Reads bridge file from ecc-metrics-bridge.js and injects agent-facing
 * warnings when thresholds are crossed: context exhaustion, high cost,
 * scope creep, or tool loops.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sanitizeSessionId, readBridge, renameWithRetry } = require('../lib/session-bridge');
const {
  getToolCategory,
  detectHeterogeneousLoop,
  getSessionState,
  saveSessionState,
  appendSentinelLog,
  checkAlertLimit,
  classifySeverity,
  HETEROGENEOUS_LOOP_THRESHOLD,
  HETEROGENEOUS_LOOP_WINDOW_MS,
  MAX_ALERTS_PER_TYPE,
  SILENCE_THRESHOLD_MS
} = require('../lib/sentinel-state');

const CONTEXT_WARNING_PCT = 35;
const CONTEXT_CRITICAL_PCT = 25;
const COST_NOTICE_USD = 5;
const COST_WARNING_USD = 10;
const COST_CRITICAL_USD = 50;
const FILES_WARNING_COUNT = 20;
const LOOP_THRESHOLD = 3;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

function isEnabledEnv(value, defaultValue = true) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  return defaultValue;
}

function costWarningsEnabled(env = process.env) {
  return isEnabledEnv(env.ECC_CONTEXT_MONITOR_COST_WARNINGS, true);
}

/**
 * Get debounce state file path.
 * @param {string} sessionId
 * @returns {string}
 */
function getWarnPath(sessionId) {
  return path.join(os.tmpdir(), `ecc-ctx-warn-${sessionId}.json`);
}

/**
 * Read debounce state.
 * @param {string} sessionId
 * @returns {object}
 */
function readWarnState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(getWarnPath(sessionId), 'utf8'));
  } catch {
    return { callsSinceWarn: 0, lastSeverity: null };
  }
}

/**
 * Write debounce state atomically (unique-suffix tmp then rename).
 *
 * The tmp path includes `process.pid` plus a random nonce so concurrent
 * PostToolUse subprocesses writing to the same session's warn-state
 * file do not clobber each other's tmp mid-write. Without the unique
 * suffix, two writers race over a shared `${target}.tmp` and produce
 * either a corrupted payload or an ENOENT throw on the second rename.
 *
 * Same pattern as `writeBridgeAtomic` in `scripts/lib/session-bridge.js`
 * and `writeCostWarningIfChanged` in `scripts/hooks/ecc-metrics-bridge.js`.
 *
 * @param {string} sessionId
 * @param {object} state
 */
function writeWarnState(sessionId, state) {
  const target = getWarnPath(sessionId);
  const tmp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state), 'utf8');
  try {
    renameWithRetry(tmp, target);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Detect tool loops from recent_tools ring buffer.
 * @param {Array} recentTools
 * @returns {{detected: boolean, tool: string, count: number}}
 */
function detectLoop(recentTools) {
  if (!Array.isArray(recentTools) || recentTools.length < LOOP_THRESHOLD) {
    return { detected: false, tool: '', count: 0 };
  }
  const counts = {};
  for (const entry of recentTools) {
    const key = `${entry.tool}:${entry.hash}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(counts)) {
    if (count >= LOOP_THRESHOLD) {
      return { detected: true, tool: key.split(':')[0], count };
    }
  }
  return { detected: false, tool: '', count: 0 };
}

/**
 * Evaluate all warning conditions against bridge data.
 * Returns array of {severity, type, message} sorted by severity desc.
 */
function evaluateConditions(bridge, options = {}) {
  const warnings = [];
  const remaining = bridge.context_remaining_pct;

  // Context warnings (skip if no context data)
  if (remaining !== null && remaining !== undefined) {
    if (remaining <= CONTEXT_CRITICAL_PCT) {
      warnings.push({
        severity: 3,
        type: 'context',
        message:
          `CONTEXT CRITICAL: ${remaining}% remaining. Context nearly exhausted. ` +
          'Inform the user that context is low and ask how they want to proceed. ' +
          'Do NOT autonomously save state or write handoff files unless the user asks.'
      });
    } else if (remaining <= CONTEXT_WARNING_PCT) {
      warnings.push({
        severity: 2,
        type: 'context',
        message: `CONTEXT WARNING: ${remaining}% remaining. ` + 'Be aware that context is getting limited. Avoid starting new complex work.'
      });
    }
  }

  // Cost warnings
  if (options.costWarnings !== false) {
    const cost = bridge.total_cost_usd || 0;
    if (cost > COST_CRITICAL_USD) {
      warnings.push({
        severity: 3,
        type: 'cost',
        message: `COST CRITICAL: Session cost is $${cost.toFixed(2)}. ` + 'Stop and inform the user about high cost before continuing.'
      });
    } else if (cost > COST_WARNING_USD) {
      warnings.push({
        severity: 2,
        type: 'cost',
        message: `COST WARNING: Session cost is $${cost.toFixed(2)}. ` + 'Review whether the current approach justifies the expense.'
      });
    } else if (cost > COST_NOTICE_USD) {
      warnings.push({
        severity: 1,
        type: 'cost',
        message: `COST NOTICE: Session cost is $${cost.toFixed(2)}. ` + 'Consider whether the current approach is efficient.'
      });
    }
  }

  // File scope warning
  const fileCount = bridge.files_modified_count || 0;
  if (fileCount > FILES_WARNING_COUNT) {
    warnings.push({
      severity: 2,
      type: 'scope',
      message: `SCOPE WARNING: ${fileCount} files modified this session. ` + 'Consider whether changes are too scattered.'
    });
  }

  // Homogeneous loop detection (existing)
  const loop = detectLoop(bridge.recent_tools);
  if (loop.detected) {
    warnings.push({
      severity: 2,
      type: 'loop',
      message: `[哨兵 Type5] LOOP WARNING: Tool '${loop.tool}' called ${loop.count} times ` +
        'with same parameters in last 5 calls. This may indicate a stuck loop.'
    });
  }

  // ── Sentinel: Heterogeneous loop detection ──────────────────────
  if (options.sessionId && options.operationHistory) {
    const now = Date.now();
    const heteroLoop = detectHeterogeneousLoop(options.operationHistory, now);
    if (heteroLoop.detected) {
      const sev = classifySeverity('type5_hetero_loop', { count: heteroLoop.count });
      warnings.push({
        severity: sev === 'alert' ? 3 : 2,
        type: 'sentinel_hetero_loop',
        message: `[哨兵 Type5] HETEROGENEOUS LOOP WARNING: ` +
          `${heteroLoop.count} ${heteroLoop.category} operations ` +
          `(using ${heteroLoop.tools.join(', ')}) in last 5 minutes. ` +
          'This may indicate a stuck pattern across different targets.'
      });
    }
  }

  // ── Sentinel: Silence detection ──────────────────────────────────
  if (options.silenceDetected) {
    const sev = classifySeverity('type6_silence', { durationMs: options.silenceMs });
    warnings.push({
      severity: sev === 'alert' ? 3 : 2,
      type: 'sentinel_silence',
      message: options.silenceMessage
    });
  }

  return warnings.sort((a, b) => b.severity - a.severity);
}

/**
 * Map numeric severity to label.
 */
function severityLabel(n) {
  if (n >= 3) return 'critical';
  if (n >= 2) return 'warning';
  return 'notice';
}

// ── Sentinel: Silence Detection ─────────────────────────────────────

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
 * Check for silence (no tool result for ≥ SILENCE_THRESHOLD_MS).
 * @param {object} sentinelState
 * @param {number} now - current time in ms
 * @returns {{ detected: boolean, silenceMs: number, message: string }}
 */
function detectSilence(sentinelState, now) {
  const lastResultAt = sentinelState.last_tool_result_at || now;
  const silenceMs = now - lastResultAt;

  if (silenceMs < SILENCE_THRESHOLD_MS) {
    return { detected: false, silenceMs, message: '' };
  }

  return {
    detected: true,
    silenceMs,
    message: `[哨兵 Type6] SILENCE WARNING: No tool output for ${formatDuration(silenceMs)}. ` +
      'The operation may be stuck or the agent may have stopped responding.'
  };
}

/**
 * @param {string} rawInput - Raw JSON string from stdin
 * @returns {string} JSON output with additionalContext or pass-through
 */
function run(rawInput) {
  try {
    const input = rawInput.trim() ? JSON.parse(rawInput) : {};

    const sessionId = sanitizeSessionId(input.session_id) || sanitizeSessionId(process.env.ECC_SESSION_ID) || sanitizeSessionId(process.env.CLAUDE_SESSION_ID);

    if (!sessionId) return rawInput;

    const bridge = readBridge(sessionId);
    if (!bridge) return rawInput;

    // Stale check for context warnings
    const now = Math.floor(Date.now() / 1000);
    const lastTs = bridge.last_timestamp ? Math.floor(new Date(bridge.last_timestamp).getTime() / 1000) : 0;
    const isStale = lastTs > 0 && now - lastTs > STALE_SECONDS;

    // If bridge is stale, null out context data (still check cost/scope/loop)
    const evalBridge = isStale ? { ...bridge, context_remaining_pct: null } : bridge;

    // ── Sentinel: update operation history ──────────────────────────
    const sentinelState = getSessionState(sessionId);
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};
    const category = getToolCategory(toolName);

    sentinelState.operation_history = sentinelState.operation_history || [];
    sentinelState.operation_history.push({
      category,
      tool: toolName,
      file_path: toolInput.file_path || '',
      timestamp: Date.now()
    });

    // Prune history older than 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000;
    sentinelState.operation_history = sentinelState.operation_history
      .filter(op => op.timestamp >= cutoff);

    // Update last tool result time
    const nowMs = Date.now();

    // ── Sentinel: Silence detection ──────────────────────────────────
    const silence = detectSilence(sentinelState, nowMs);

    sentinelState.last_tool_result_at = nowMs;

    saveSessionState(sessionId, sentinelState);

    const warnings = evaluateConditions(evalBridge, {
      costWarnings: costWarningsEnabled(),
      sessionId,
      operationHistory: sentinelState.operation_history,
      silenceDetected: silence.detected,
      silenceMs: silence.silenceMs,
      silenceMessage: silence.message
    });
    if (warnings.length === 0) return rawInput;

    // Debounce logic
    const warnState = readWarnState(sessionId);
    warnState.callsSinceWarn = (warnState.callsSinceWarn || 0) + 1;

    const topSeverity = severityLabel(warnings[0].severity);
    const severityEscalated = topSeverity === 'critical' && warnState.lastSeverity !== 'critical';

    const isFirst = !warnState.lastSeverity;
    if (!isFirst && warnState.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      writeWarnState(sessionId, warnState);
      return rawInput;
    }

    // ── Sentinel: check alert limits before emitting ────────────────
    const sentinelWarnings = warnings.filter(w => w.type.startsWith('sentinel_'));
    for (const sw of sentinelWarnings) {
      const sev = sw.severity >= 3 ? 'alert' : sw.severity >= 2 ? 'advisory' : 'silent';
      const limit = checkAlertLimit(sentinelState, sw.type, sev);
      if (!limit.shouldEmit) {
        // Remove this warning from the list (silenced)
        const idx = warnings.indexOf(sw);
        if (idx >= 0) warnings.splice(idx, 1);
      } else {
        // Log the alert
        appendSentinelLog({
          signal_type: sw.type,
          severity: sev,
          description: sw.message,
          context: {
            session_id: sessionId,
            tool_name: toolName,
            operation_count: sentinelState.operation_history.length
          }
        });
      }
    }

    if (warnings.length === 0) return rawInput;

    // Reset debounce, emit warning
    warnState.callsSinceWarn = 0;
    warnState.lastSeverity = topSeverity;
    writeWarnState(sessionId, warnState);

    // Save updated alert counts
    saveSessionState(sessionId, sentinelState);

    // Combine top 2 warnings
    const message = warnings
      .slice(0, 2)
      .map(w => w.message)
      .join('\n');

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    };

    return JSON.stringify(output);
  } catch {
    // Never block tool execution
    return rawInput;
  }
}

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

module.exports = { run, evaluateConditions, detectLoop, severityLabel, costWarningsEnabled };
