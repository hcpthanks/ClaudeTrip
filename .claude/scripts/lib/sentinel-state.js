#!/usr/bin/env node
/**
 * Sentinel Shared State Library
 *
 * Provides read/write access to the sentinel state file
 * (.claude/sentinel-state.json), which serves as the data bus between
 * sentinel Hook scripts (engine layer) and sentinel Agent (model layer).
 *
 * Also provides the sentinel log writer (.claude/sentinel-log.jsonl).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Configuration Constants ──────────────────────────────────────────

/** Per-session max alerts per signal type before silencing. */
const MAX_ALERTS_PER_TYPE = 3;

/** Heterogeneous loop: max operations of same category in window */
const HETEROGENEOUS_LOOP_THRESHOLD = 5;
const HETEROGENEOUS_LOOP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Timing anomaly: multiplier over historical median */
const TIMING_ANOMALY_MULTIPLIER = 3;
/** Minimum absolute duration (ms) before flagging timing anomaly */
const TIMING_MIN_ABSOLUTE_MS = 10000; // 10s

/** Silence detection threshold (ms) */
const SILENCE_THRESHOLD_MS = 60 * 1000; // 60s

// ── Sentinel State File ──────────────────────────────────────────────

function getClaudeDir() {
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  return path.join(home, '.claude');
}

function getSentinelStatePath() {
  return path.join(getClaudeDir(), 'sentinel-state.json');
}

function getSentinelLogPath() {
  return path.join(getClaudeDir(), 'sentinel-log.jsonl');
}

/**
 * Read sentinel state. Returns default empty state on any error.
 * @returns {object}
 */
function readSentinelState() {
  try {
    const raw = fs.readFileSync(getSentinelStatePath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Write sentinel state atomically.
 * @param {object} state
 */
function writeSentinelState(state) {
  const target = getSentinelStatePath();
  const tmp = `${target}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tmp, target);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Get or create per-session state within the sentinel state file.
 * @param {string} sessionId
 * @returns {object}
 */
function getSessionState(sessionId) {
  const state = readSentinelState();
  if (!state[sessionId]) {
    state[sessionId] = {
      session_start: new Date().toISOString(),
      alert_counts: {},     // { signal_type: count }
      operation_history: [], // [{ category, tool, file_path, timestamp }]
      timing_baselines: {},  // { command_prefix: { count, median_ms } }
      last_tool_result_at: Date.now(),
      last_alert_at: 0
    };
  }
  return state[sessionId];
}

/**
 * Save per-session state back to the file.
 * @param {string} sessionId
 * @param {object} sessionState
 */
function saveSessionState(sessionId, sessionState) {
  const state = readSentinelState();
  state[sessionId] = sessionState;
  writeSentinelState(state);
}

// ── Sentinel Log ─────────────────────────────────────────────────────

/**
 * Append a sentinel event to the JSONL log.
 * @param {object} event - { timestamp, signal_type, severity, description, context }
 */
function appendSentinelLog(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  try {
    fs.appendFileSync(getSentinelLogPath(), JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // Never block on log write failure
  }
}

// ── Category Classification ──────────────────────────────────────────

/**
 * Map tool name to operation category for heterogeneous loop detection.
 */
const TOOL_CATEGORIES = {
  Write: 'file_mutation',
  Edit: 'file_mutation',
  MultiEdit: 'file_mutation',
  Bash: 'shell_exec',
  Agent: 'agent_spawn',
  Task: 'agent_spawn',
  Glob: 'file_read',
  Grep: 'file_read',
  Read: 'file_read',
  WebFetch: 'network',
  WebSearch: 'network',
};

/**
 * Get the operation category for a tool name.
 * @param {string} toolName
 * @returns {string}
 */
function getToolCategory(toolName) {
  return TOOL_CATEGORIES[toolName] || 'other';
}

// ── Heterogeneous Loop Detection ─────────────────────────────────────

/**
 * Detect heterogeneous loops: same operation category occurring
 * >= HETEROGENEOUS_LOOP_THRESHOLD times within the window.
 * This catches patterns like Edit A → Edit B → Edit C → Edit D → Edit E
 * that homogeneous detection misses.
 *
 * @param {Array} operationHistory - [{ category, tool, file_path, timestamp }]
 * @param {number} now - current timestamp in ms
 * @returns {{ detected: boolean, category: string, count: number, tools: string[] }}
 */
function detectHeterogeneousLoop(operationHistory, now) {
  if (!Array.isArray(operationHistory) || operationHistory.length < HETEROGENEOUS_LOOP_THRESHOLD) {
    return { detected: false, category: '', count: 0, tools: [] };
  }

  const cutoff = now - HETEROGENEOUS_LOOP_WINDOW_MS;
  const recent = operationHistory.filter(op => {
    const ts = typeof op.timestamp === 'number' ? op.timestamp : Date.parse(op.timestamp);
    return ts >= cutoff;
  });

  // Count by category
  const categoryCounts = {};
  const categoryTools = {};
  for (const op of recent) {
    const cat = op.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (!categoryTools[cat]) categoryTools[cat] = new Set();
    categoryTools[cat].add(op.tool);
  }

  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count >= HETEROGENEOUS_LOOP_THRESHOLD) {
      return {
        detected: true,
        category: cat,
        count,
        tools: [...categoryTools[cat]]
      };
    }
  }

  return { detected: false, category: '', count: 0, tools: [] };
}

// ── Timing Baseline ──────────────────────────────────────────────────

/**
 * Compute rolling median of a sorted array of numbers.
 * @param {number[]} sorted
 * @returns {number}
 */
function median(sorted) {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Update timing baseline for a command and check if current duration
 * is anomalous.
 *
 * @param {object} baselines - { command_prefix: { durations_ms: [], median_ms } }
 * @param {string} command - the command string to extract prefix from
 * @param {number} durationMs - duration of this execution
 * @returns {{ isAnomaly: boolean, baselineMs: number, ratio: number }}
 */
function checkTimingAnomaly(baselines, command, durationMs) {
  // Extract command prefix (first meaningful word)
  const prefix = extractCommandPrefix(command);

  if (!baselines[prefix]) {
    baselines[prefix] = { durations_ms: [], median_ms: 0 };
  }

  const baseline = baselines[prefix];
  baseline.durations_ms.push(durationMs);

  // Keep last 20 durations
  if (baseline.durations_ms.length > 20) {
    baseline.durations_ms.shift();
  }

  // Need at least 3 data points for a baseline
  if (baseline.durations_ms.length < 3) {
    const sorted = [...baseline.durations_ms].sort((a, b) => a - b);
    baseline.median_ms = median(sorted);
    return { isAnomaly: false, baselineMs: baseline.median_ms, ratio: 1 };
  }

  const sorted = [...baseline.durations_ms].sort((a, b) => a - b);
  baseline.median_ms = median(sorted);

  // Check if current duration exceeds threshold
  if (durationMs > TIMING_MIN_ABSOLUTE_MS &&
      baseline.median_ms > 0 &&
      durationMs > baseline.median_ms * TIMING_ANOMALY_MULTIPLIER) {
    return {
      isAnomaly: true,
      baselineMs: baseline.median_ms,
      ratio: durationMs / baseline.median_ms
    };
  }

  return { isAnomaly: false, baselineMs: baseline.median_ms, ratio: durationMs / (baseline.median_ms || 1) };
}

/**
 * Extract a meaningful command prefix for grouping.
 * @param {string} command
 * @returns {string}
 */
function extractCommandPrefix(command) {
  if (!command || typeof command !== 'string') return 'unknown';
  const trimmed = command.trim();

  // Special prefixes
  const PREFIXES = ['git', 'npm', 'npx', 'pnpm', 'yarn', 'pip', 'python',
    'node', 'cargo', 'go', 'docker', 'curl', 'wget', 'ffmpeg', 'winget',
    'choco', 'scoop', 'gh', 'java', 'javac'];
  for (const p of PREFIXES) {
    if (trimmed.startsWith(p + ' ') || trimmed === p) return p;
  }

  // First word
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord.length > 30 ? firstWord.slice(0, 30) : firstWord;
}

// ── Alert Level Management ───────────────────────────────────────────

/**
 * Determine if alert should be emitted based on self-limiting rules.
 * @param {object} sessionState
 * @param {string} signalType - e.g. 'type4_timing', 'type5_hetero_loop'
 * @param {string} severity - 'silent' | 'advisory' | 'alert'
 * @returns {{ shouldEmit: boolean, severity: string }}
 */
function checkAlertLimit(sessionState, signalType, severity) {
  const counts = sessionState.alert_counts || {};
  const current = counts[signalType] || 0;

  // SILENT: always log, never notify
  if (severity === 'silent') {
    counts[signalType] = current + 1;
    sessionState.alert_counts = counts;
    return { shouldEmit: false, severity: 'silent' };
  }

  // ADVISORY / ALERT: limit per session
  if (current >= MAX_ALERTS_PER_TYPE) {
    counts[signalType] = current + 1;
    sessionState.alert_counts = counts;
    return { shouldEmit: false, severity: 'silent' }; // downgrade to silent
  }

  counts[signalType] = current + 1;
  sessionState.alert_counts = counts;
  return { shouldEmit: true, severity };
}

// ── Severity Classification ──────────────────────────────────────────

/**
 * Classify a sentinel finding into a severity level.
 * @param {string} signalType
 * @param {object} details
 * @returns {'silent' | 'advisory' | 'alert'}
 */
function classifySeverity(signalType, details) {
  switch (signalType) {
    case 'type4_timing':
      // Timing anomaly: advisory unless extreme
      const ratio = details.ratio || 0;
      if (ratio >= 10) return 'alert';
      if (ratio >= 5) return 'advisory';
      return 'silent';

    case 'type5_hetero_loop':
      // Heterogeneous loop: depends on count
      const count = details.count || 0;
      if (count >= 10) return 'alert';
      if (count >= HETEROGENEOUS_LOOP_THRESHOLD) return 'advisory';
      return 'silent';

    case 'type5_homo_loop':
      // Homogeneous loop (from context-monitor)
      return 'advisory';

    case 'type6_silence':
      // Silence: advisory
      return 'advisory';

    default:
      return 'advisory';
  }
}

module.exports = {
  // Constants
  MAX_ALERTS_PER_TYPE,
  HETEROGENEOUS_LOOP_THRESHOLD,
  HETEROGENEOUS_LOOP_WINDOW_MS,
  TIMING_ANOMALY_MULTIPLIER,
  TIMING_MIN_ABSOLUTE_MS,
  SILENCE_THRESHOLD_MS,

  // State management
  readSentinelState,
  writeSentinelState,
  getSessionState,
  saveSessionState,

  // Logging
  appendSentinelLog,

  // Category classification
  TOOL_CATEGORIES,
  getToolCategory,

  // Detection
  detectHeterogeneousLoop,
  checkTimingAnomaly,
  extractCommandPrefix,

  // Alert management
  checkAlertLimit,
  classifySeverity,
};
