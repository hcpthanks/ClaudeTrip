// Claude Code Status Line — anti-tracking + session time + context usage
// Reads JSON from stdin, outputs formatted status line

const fs = require('fs');
const { join } = require('path');
const input = fs.readFileSync(0, 'utf8');
const data = JSON.parse(input);

const model = data.model?.display_name || 'Claude';
const pct = data.context_window?.used_percentage || 0;
const total = data.context_window?.total_input_tokens || 0;
const output = data.context_window?.total_output_tokens || 0;
const window = data.context_window?.context_window_size || 200000;

// --- Anti-tracking indicator ---
const stateFile = join(
  process.env.USERPROFILE || process.env.HOME,
  '.claude/skills/anti-tracking/state/defense-active.json'
);
let antiTrackingActive = false;
try {
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    antiTrackingActive = state.active === true;
  }
} catch (_) { /* ignore */ }

const shield = antiTrackingActive
  ? '\x1b[32m[DEF]\x1b[0m'
  : '\x1b[31m[OFF]\x1b[0m';

// --- Session time tracking (persisted to .ss.json) ---
const ssFile = join(__dirname, '.ss.json');
let sessionTime = '';
try {
  let ss = {};
  try { if (fs.existsSync(ssFile)) ss = JSON.parse(fs.readFileSync(ssFile, 'utf8')); } catch (_) {}
  const id = data.session_id || '?';
  if (!ss[id]) {
    ss[id] = Date.now();
    const ks = Object.keys(ss);
    if (ks.length > 20) {
      ks.sort((a, b) => ss[a] - ss[b]);
      ks.slice(0, ks.length - 20).forEach(k => delete ss[k]);
    }
    try { fs.writeFileSync(ssFile, JSON.stringify(ss)); } catch (_) {}
  }
  const elapsed = Date.now() - ss[id];
  const m = Math.floor(elapsed / 60000);
  const h = Math.floor(m / 60);
  sessionTime = h ? h + 'h ' + (m % 60) + 'm' : m + 'm';
} catch (_) { /* ignore */ }

// --- Output ---
const usedK = Math.round((total + output) / 100) / 10;
const totalK = Math.round(window / 100) / 10;
const pctStr = pct != null && !isNaN(pct) ? Math.round(pct) + '%' : '--';

// Color based on usage
let color = '32';
if (pct > 75) color = '31';
else if (pct > 50) color = '33';

process.stdout.write(
  `${shield} \x1b[35m${model}\x1b[0m | ${sessionTime} | \x1b[${color}m${pctStr}\x1b[0m (${usedK}k/${totalK}k)\n`
);
