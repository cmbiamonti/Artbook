#!/usr/bin/env node
/**
 * Krea4U — Scanner stringhe italiane nei file .tsx
 * Utilizzo: node scan-strings.js [percorso/src]
 * Default: ./src
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = process.argv[2] || './src';
const OUTPUT_JSON = './i18n-scan-output.json';
const OUTPUT_HTML = './i18n-scan-report.html';

// ── Patterns per catturare stringhe italiane ──────────────────────────────────

const PATTERNS = [
  // JSX text content: <h1>Testo italiano</h1>
  {
    name: 'JSX text content',
    regex: />([A-ZÀÈÌÒÙ][a-zA-ZàèìòùÀÈÌÒÙéáóúí\s\-''.,!?:;()&\/°%]{3,})</g,
    group: 1,
    category: 'jsx_text',
  },
  // Attributi stringa: placeholder="...", title="...", label="...", aria-label="..."
  {
    name: 'placeholder',
    regex: /placeholder=["']([^"']{4,})["']/g,
    group: 1,
    category: 'attribute',
  },
  {
    name: 'title attribute',
    regex: /title=["']([^"']{4,})["']/g,
    group: 1,
    category: 'attribute',
  },
  {
    name: 'aria-label',
    regex: /aria-label=["']([^"']{4,})["']/g,
    group: 1,
    category: 'attribute',
  },
  {
    name: 'tooltip / data-tip',
    regex: /(?:tooltip|data-tip)=["']([^"']{4,})["']/g,
    group: 1,
    category: 'attribute',
  },
  // Stringhe in variabili TypeScript: const msg = "Testo italiano"
  {
    name: 'TS string variable',
    regex: /(?:message|label|title|text|error|success|warning|info|description|hint)\s*[:=]\s*["'`]([A-ZÀÈÌÒÙ][^"'`\n]{4,})["'`]/gi,
    group: 1,
    category: 'ts_string',
  },
  // Toast / alert: toast("Messaggio"), alert("Messaggio")
  {
    name: 'toast / alert call',
    regex: /(?:toast|alert|notify|showError|showSuccess)\s*\(\s*["'`]([A-ZÀÈÌÒÙ][^"'`\n]{3,})["'`]/g,
    group: 1,
    category: 'function_call',
  },
  // console / throw con messaggi utente (raro ma utile)
  {
    name: 'throw Error message',
    regex: /throw new Error\s*\(\s*["'`]([^"'`\n]{4,})["'`]/g,
    group: 1,
    category: 'error',
  },
];

// Stringhe da ignorare — tecniche, non UI
const IGNORE_PATTERNS = [
  /^https?:\/\//,
  /^\d+$/,
  /^[a-z_-]+$/,           // variabili/classi CSS
  /^\s*$/,
  /^[A-Z_]+$/,            // costanti
  /\.(ts|tsx|js|css|png|jpg|svg|json)$/,
  /^#[0-9a-fA-F]{3,8}$/,  // colori hex
  /className/,
  /import /,
  /export /,
  /console\./,
];

function shouldIgnore(str) {
  const trimmed = str.trim();
  if (trimmed.length < 3) return true;
  return IGNORE_PATTERNS.some(p => p.test(trimmed));
}

// ── Rilevamento italiano ──────────────────────────────────────────────────────

const ITALIAN_CHARS = /[àèìòùÀÈÌÒÙéáóúí]/;
const ITALIAN_WORDS = /\b(il|lo|la|le|gli|un|una|uno|di|da|in|con|su|per|tra|fra|del|della|dello|dei|degli|delle|al|alla|allo|ai|agli|alle|nel|nella|nello|nei|negli|nelle|sul|sulla|sullo|sui|sugli|sulle|che|non|ma|se|come|dove|quando|questo|questa|questi|queste|quello|quella|quelli|quelle|essere|avere|fare|salva|annulla|carica|elimina|modifica|cerca|inserisci|aggiungi|nuovo|nuova|opera|artista|contatto|impostazioni|gestione|lista|dettaglio|errore|successo|attenzione)\b/i;

function isLikelyItalian(str) {
  return ITALIAN_CHARS.test(str) || ITALIAN_WORDS.test(str);
}

// ── Suggerisci chiave i18n ────────────────────────────────────────────────────

function suggestKey(str, filename) {
  const section = filename
    .replace(/\.(tsx|ts)$/, '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .split('/').pop();

  const keyPart = str
    .toLowerCase()
    .replace(/[àèìòù]/g, c => ({ à: 'a', è: 'e', ì: 'i', ò: 'o', ù: 'u' }[c] || c))
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_');

  return `${section}.${keyPart}`;
}

// ── Scansione file ────────────────────────────────────────────────────────────

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const filename = path.relative(SRC_DIR, filePath);
  const findings = [];

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const str = match[pattern.group].trim();
      if (shouldIgnore(str)) continue;
      if (!isLikelyItalian(str)) continue;

      // Trova numero di riga
      const beforeMatch = content.slice(0, match.index);
      const lineNum = beforeMatch.split('\n').length;
      const lineContent = lines[lineNum - 1]?.trim() || '';

      // Evita duplicati nello stesso file
      if (findings.some(f => f.string === str)) continue;

      findings.push({
        string: str,
        file: filename,
        line: lineNum,
        lineContent,
        category: pattern.category,
        patternName: pattern.name,
        suggestedKey: suggestKey(str, filename),
        alreadyTranslated: content.includes(`t('`) && content.includes(str) === false,
      });
    }
  }

  return findings;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Cartella non trovata: ${dir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git', 'locales'].includes(entry.name)) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && !entry.name.includes('.test.')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n🔍 Krea4U — Scanner i18n`);
console.log(`📁 Scansione: ${path.resolve(SRC_DIR)}\n`);

const files = walkDir(SRC_DIR);
console.log(`📄 File .tsx/.ts trovati: ${files.length}`);

const allFindings = [];
const byFile = {};

for (const file of files) {
  const findings = scanFile(file);
  if (findings.length > 0) {
    const relPath = path.relative(SRC_DIR, file);
    byFile[relPath] = findings;
    allFindings.push(...findings);
  }
}

// ── Genera JSON di output ─────────────────────────────────────────────────────

const jsonOut = {
  generatedAt: new Date().toISOString(),
  srcDir: path.resolve(SRC_DIR),
  totalFiles: files.length,
  filesWithStrings: Object.keys(byFile).length,
  totalStrings: allFindings.length,
  byFile,
  // Genera anche una bozza it/translation.json
  draftTranslationIt: Object.fromEntries(
    allFindings.map(f => [f.suggestedKey, f.string])
  ),
};

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonOut, null, 2));
console.log(`\n✅ JSON salvato: ${OUTPUT_JSON}`);
console.log(`   ${allFindings.length} stringhe trovate in ${Object.keys(byFile).length} file\n`);

// ── Genera HTML report ────────────────────────────────────────────────────────

const categoryColors = {
  jsx_text: '#3B82F6',
  attribute: '#8B5CF6',
  ts_string: '#10B981',
  function_call: '#F59E0B',
  error: '#EF4444',
};

const categoryLabels = {
  jsx_text: 'JSX Text',
  attribute: 'Attributo',
  ts_string: 'Variabile TS',
  function_call: 'Funzione',
  error: 'Errore',
};

const fileRows = Object.entries(byFile).map(([file, findings]) => `
  <div class="file-block">
    <div class="file-header">
      <span class="file-icon">📄</span>
      <span class="file-name">${file}</span>
      <span class="file-badge">${findings.length} stringhe</span>
    </div>
    <table class="strings-table">
      <thead>
        <tr>
          <th style="width:40px">Riga</th>
          <th>Stringa italiana</th>
          <th>Chiave i18n suggerita</th>
          <th style="width:110px">Tipo</th>
        </tr>
      </thead>
      <tbody>
        ${findings.map(f => `
        <tr>
          <td class="line-num">${f.line}</td>
          <td><span class="string-val">${escapeHtml(f.string)}</span></td>
          <td><code class="key-code">${f.suggestedKey}</code></td>
          <td><span class="tag" style="background:${categoryColors[f.category]}20;color:${categoryColors[f.category]};border-color:${categoryColors[f.category]}40">${categoryLabels[f.category]}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
`).join('');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const draftIt = JSON.stringify(
  Object.fromEntries(allFindings.map(f => [f.suggestedKey, f.string])),
  null, 2
);
const draftEn = JSON.stringify(
  Object.fromEntries(allFindings.map(f => [f.suggestedKey, ''])),
  null, 2
);

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Krea4U — i18n Scanner Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0F1117;
    --surface: #1A1D27;
    --surface2: #21263A;
    --border: #2D3248;
    --blue: #4F8EF7;
    --blue-dim: #4F8EF720;
    --green: #34D399;
    --orange: #F59E0B;
    --purple: #A78BFA;
    --red: #F87171;
    --text: #E2E8F0;
    --text-dim: #8892AA;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
  }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.6;
  }

  /* ── HEADER ── */
  .header {
    background: linear-gradient(135deg, #1A1D27 0%, #12162B 100%);
    border-bottom: 1px solid var(--border);
    padding: 40px 48px 32px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, #4F8EF718 0%, transparent 70%);
    pointer-events: none;
  }
  .header-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .logo { font-family: var(--mono); font-size: 13px; color: var(--blue); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
  .header h1 { font-size: 32px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .header h1 span { color: var(--blue); }
  .header-meta { font-size: 13px; color: var(--text-dim); margin-top: 6px; font-family: var(--mono); }

  /* ── STATS ── */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border-bottom: 1px solid var(--border);
  }
  .stat-box {
    background: var(--surface);
    padding: 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--mono); }
  .stat-value { font-size: 32px; font-weight: 700; color: var(--blue); font-family: var(--mono); line-height: 1; }
  .stat-sub { font-size: 12px; color: var(--text-dim); }

  /* ── MAIN LAYOUT ── */
  .main { display: grid; grid-template-columns: 280px 1fr; min-height: calc(100vh - 180px); }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 24px 0;
    position: sticky;
    top: 0;
    height: calc(100vh - 180px);
    overflow-y: auto;
  }
  .sidebar-title { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--mono); padding: 0 20px 12px; }
  .sidebar-item {
    padding: 8px 20px;
    font-size: 12px;
    color: var(--text-dim);
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all 0.15s;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--mono);
  }
  .sidebar-item:hover { background: var(--surface2); color: var(--text); border-left-color: var(--blue); }
  .sidebar-item .count { background: var(--blue-dim); color: var(--blue); font-size: 10px; padding: 1px 6px; border-radius: 10px; }

  /* ── CONTENT ── */
  .content { padding: 32px 40px; overflow-y: auto; }
  .section-title { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--mono); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }

  /* ── FILE BLOCKS ── */
  .file-block { margin-bottom: 28px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .file-header {
    background: var(--surface2);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
  }
  .file-icon { font-size: 14px; }
  .file-name { font-family: var(--mono); font-size: 13px; color: var(--blue); flex: 1; }
  .file-badge { background: var(--blue-dim); color: var(--blue); font-size: 11px; padding: 2px 8px; border-radius: 10px; font-family: var(--mono); }

  /* ── TABLE ── */
  .strings-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .strings-table th { background: var(--surface); padding: 8px 14px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); font-weight: 600; border-bottom: 1px solid var(--border); }
  .strings-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
  .strings-table tr:last-child td { border-bottom: none; }
  .strings-table tr:hover td { background: var(--surface2); }
  .line-num { font-family: var(--mono); font-size: 12px; color: var(--text-dim); text-align: center; }
  .string-val { color: var(--text); }
  .key-code { font-family: var(--mono); font-size: 12px; color: var(--green); background: #34D39910; padding: 2px 6px; border-radius: 4px; border: 1px solid #34D39930; }
  .tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; border: 1px solid; font-family: var(--mono); white-space: nowrap; }

  /* ── JSON PANELS ── */
  .json-section { margin-top: 40px; }
  .json-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
  .json-panel { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .json-panel-header { background: var(--surface2); padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
  .json-panel-title { font-family: var(--mono); font-size: 12px; color: var(--text); }
  .copy-btn { background: var(--blue); color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-family: var(--mono); transition: opacity 0.2s; }
  .copy-btn:hover { opacity: 0.8; }
  .json-body { background: var(--surface); padding: 16px; overflow-x: auto; max-height: 400px; overflow-y: auto; }
  .json-body pre { font-family: var(--mono); font-size: 11px; color: #94A3B8; line-height: 1.7; }
  .json-body pre .key { color: var(--purple); }
  .json-body pre .val-it { color: var(--orange); }
  .json-body pre .val-en { color: #475569; font-style: italic; }

  /* ── LEGEND ── */
  .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-dim); }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

  /* ── EMPTY STATE ── */
  .empty { text-align: center; padding: 80px 40px; color: var(--text-dim); }
  .empty h2 { font-size: 20px; color: var(--green); margin-bottom: 8px; }

  @media (max-width: 900px) {
    .main { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .stats-bar { grid-template-columns: repeat(2, 1fr); }
    .json-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">Krea4U Dev Tools</div>
  <div class="header-top">
    <div>
      <h1>i18n <span>Scanner</span> Report</h1>
      <div class="header-meta">Generato il ${new Date().toLocaleString('it-IT')} &nbsp;·&nbsp; src: ${path.resolve(SRC_DIR)}</div>
    </div>
  </div>
</div>

<div class="stats-bar">
  <div class="stat-box">
    <div class="stat-label">File scansionati</div>
    <div class="stat-value">${files.length}</div>
    <div class="stat-sub">file .tsx e .ts</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">File con stringhe</div>
    <div class="stat-value">${Object.keys(byFile).length}</div>
    <div class="stat-sub">richiedono migrazione</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Stringhe trovate</div>
    <div class="stat-value">${allFindings.length}</div>
    <div class="stat-sub">da aggiungere ai JSON</div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Chiavi i18n</div>
    <div class="stat-value">${allFindings.length}</div>
    <div class="stat-sub">bozza pronta nel JSON</div>
  </div>
</div>

<div class="main">
  <div class="sidebar">
    <div class="sidebar-title">File con stringhe</div>
    ${Object.entries(byFile).map(([file, findings]) => `
      <div class="sidebar-item">
        <span>${file.split('/').pop()}</span>
        <span class="count">${findings.length}</span>
      </div>
    `).join('')}
  </div>

  <div class="content">
    <div class="section-title">Stringhe italiane rilevate per file</div>

    <div class="legend">
      ${Object.entries(categoryColors).map(([k, c]) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${c}"></div>
          <span>${categoryLabels[k]}</span>
        </div>
      `).join('')}
    </div>

    ${allFindings.length === 0 ? `
      <div class="empty">
        <h2>✅ Nessuna stringa trovata!</h2>
        <p>Tutti i componenti sembrano già tradotti, oppure il percorso src non contiene file .tsx.</p>
      </div>
    ` : fileRows}

    <div class="json-section">
      <div class="section-title">Bozze JSON generate automaticamente</div>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">
        Copia queste bozze in <code style="color:var(--green);font-family:var(--mono);font-size:12px">src/locales/it/translation.json</code> e <code style="color:var(--green);font-family:var(--mono);font-size:12px">src/locales/en/translation.json</code>, poi completa le traduzioni inglesi.
      </p>
      <div class="json-grid">
        <div class="json-panel">
          <div class="json-panel-header">
            <div class="json-panel-title">🇮🇹 it/translation.json</div>
            <button class="copy-btn" onclick="copyJson('it')">Copia</button>
          </div>
          <div class="json-body">
            <pre id="json-it">${escapeHtml(draftIt)}</pre>
          </div>
        </div>
        <div class="json-panel">
          <div class="json-panel-header">
            <div class="json-panel-title">🇬🇧 en/translation.json (da completare)</div>
            <button class="copy-btn" onclick="copyJson('en')">Copia</button>
          </div>
          <div class="json-body">
            <pre id="json-en">${escapeHtml(draftEn)}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  const jsonIt = ${JSON.stringify(draftIt)};
  const jsonEn = ${JSON.stringify(draftEn)};
  function copyJson(lang) {
    const text = lang === 'it' ? jsonIt : jsonEn;
    navigator.clipboard.writeText(text).then(() => {
      const btn = event.target;
      btn.textContent = '✓ Copiato!';
      setTimeout(() => btn.textContent = 'Copia', 1500);
    });
  }
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html);
console.log(`✅ Report HTML salvato: ${OUTPUT_HTML}`);
console.log(`\n📋 Prossimi passi:`);
console.log(`   1. Apri ${OUTPUT_HTML} nel browser per vedere il report visivo`);
console.log(`   2. Copia la bozza it/translation.json nel report`);
console.log(`   3. Completa le traduzioni inglesi nel report en/translation.json`);
console.log(`   4. Sostituisci le stringhe nei .tsx con t('chiave')\n`);
