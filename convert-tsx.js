#!/usr/bin/env node
/**
 * Krea4U — Convertitore automatico .tsx per i18n
 *
 * PREREQUISITO: esegui prima scan-strings.js per generare i18n-scan-output.json
 *
 * Utilizzo:
 *   node convert-tsx.js --dry-run       # anteprima senza modificare nulla
 *   node convert-tsx.js                 # conversione reale con backup automatico
 *   node convert-tsx.js --restore       # ripristina backup originali
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const SCAN_OUTPUT   = './i18n-scan-output.json';
const BACKUP_DIR    = './i18n-backup';
const DRY_RUN       = process.argv.includes('--dry-run');
const RESTORE       = process.argv.includes('--restore');

// ── Colori terminale ──────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
};

function log(msg)    { console.log(msg); }
function ok(msg)     { console.log(`${C.green}✔${C.reset}  ${msg}`); }
function info(msg)   { console.log(`${C.blue}ℹ${C.reset}  ${msg}`); }
function warn(msg)   { console.log(`${C.yellow}⚠${C.reset}  ${msg}`); }
function changed(msg){ console.log(`${C.cyan}~${C.reset}  ${msg}`); }
function skip(msg)   { console.log(`${C.gray}–${C.reset}  ${C.gray}${msg}${C.reset}`); }
function err(msg)    { console.log(`${C.red}✖${C.reset}  ${msg}`); }
function section(t)  { console.log(`\n${C.bold}${t}${C.reset}\n${'─'.repeat(60)}`); }

// ── Restore ───────────────────────────────────────────────────────────────────

if (RESTORE) {
  section('🔄 Ripristino backup');
  if (!fs.existsSync(BACKUP_DIR)) {
    err(`Cartella backup non trovata: ${BACKUP_DIR}`);
    process.exit(1);
  }
  const backups = getAllFiles(BACKUP_DIR);
  let count = 0;
  for (const bFile of backups) {
    const rel      = path.relative(BACKUP_DIR, bFile);
    const original = path.join('.', rel);
    fs.mkdirSync(path.dirname(original), { recursive: true });
    fs.copyFileSync(bFile, original);
    ok(`Ripristinato: ${rel}`);
    count++;
  }
  log(`\n${C.green}${C.bold}${count} file ripristinati.${C.reset}\n`);
  process.exit(0);
}

// ── Carica scan output ────────────────────────────────────────────────────────

if (!fs.existsSync(SCAN_OUTPUT)) {
  err(`File scan non trovato: ${SCAN_OUTPUT}`);
  info('Esegui prima:  node scan-strings.js ./src');
  process.exit(1);
}

const scanData = JSON.parse(fs.readFileSync(SCAN_OUTPUT, 'utf8'));
const { srcDir, byFile } = scanData;

if (!byFile || Object.keys(byFile).length === 0) {
  info('Nessuna stringa trovata nello scan. Niente da convertire.');
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...getAllFiles(full));
    else files.push(full);
  }
  return files;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Controlla se il file usa già useTranslation ───────────────────────────────

function hasUseTranslation(content) {
  return content.includes('useTranslation');
}

// ── Aggiunge import react-i18next se mancante ─────────────────────────────────

function addImport(content) {
  if (hasUseTranslation(content)) return { content, added: false };

  // Trova l'ultimo import statement
  const importRegex = /^import .+$/m;
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i;
  }

  const importLine = "import { useTranslation } from 'react-i18next';";
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }

  return { content: lines.join('\n'), added: true };
}

// ── Aggiunge const { t } = useTranslation() nel componente ───────────────────

function addHook(content) {
  if (/const\s*\{\s*t[,\s}]/.test(content)) return { content, added: false };

  // Cerca il primo function/arrow component body
  // Pattern: function Name( o const Name = ( o const Name: React.FC
  const patterns = [
    // const Foo = () => {
    /const\s+\w+\s*(?::\s*\w+(?:<[^>]*>)?)?\s*=\s*(?:\([^)]*\)|[^=>{]+)\s*=>\s*\{/,
    // function Foo(...) {
    /function\s+\w+\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{/,
    // export default function Foo
    /export\s+default\s+function\s+\w+\s*\([^)]*\)\s*(?::\s*\S+\s*)?\{/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(content);
    if (match) {
      const insertPos = match.index + match[0].length;
      const hookLine  = '\n  const { t } = useTranslation();';
      const before    = content.slice(0, insertPos);
      const after     = content.slice(insertPos);
      // Evita doppia aggiunta
      if (after.trimStart().startsWith('const { t }')) {
        return { content, added: false };
      }
      return { content: before + hookLine + after, added: true };
    }
  }

  warn('  Hook non inserito automaticamente — aggiungi manualmente: const { t } = useTranslation();');
  return { content, added: false };
}

// ── Sostituisce le stringhe con t('chiave') ───────────────────────────────────

function replaceStrings(content, findings) {
  let result   = content;
  let replaced = 0;
  const log_items = [];

  // Ordina per lunghezza decrescente: sostituisce prima le stringhe più lunghe
  // per evitare che una sottostringa venga rimpiazzata prima della stringa completa
  const sorted = [...findings].sort((a, b) => b.string.length - a.string.length);

  for (const f of sorted) {
    const { string: str, suggestedKey: key, category } = f;

    // Salta se già dentro una chiamata t()
    if (result.includes(`t('${key}')`)) {
      log_items.push({ status: 'skip', str, key });
      continue;
    }

    let didReplace = false;

    if (category === 'jsx_text') {
      // Sostituisce: >Testo italiano< → {t('chiave')}
      // Gestisce spazi e newline attorno al testo
      const pattern = new RegExp(
        `(>)(\\s*)(${escapeRegex(str)})(\\s*)(<)`,
        'g'
      );
      const newContent = result.replace(pattern, (_, gt, sp1, _s, sp2, lt) => {
        return `${gt}{t('${key}')}${lt}`;
      });
      if (newContent !== result) {
        result     = newContent;
        didReplace = true;
      }
    }

    if (!didReplace && category === 'attribute') {
      // Sostituisce attributi: placeholder="Testo" → placeholder={t('chiave')}
      const attrPatterns = [
        new RegExp(`(placeholder|title|aria-label|data-tip|tooltip)=["']${escapeRegex(str)}["']`, 'g'),
      ];
      for (const pattern of attrPatterns) {
        const newContent = result.replace(pattern, (_, attr) => {
          return `${attr}={t('${key}')}`;
        });
        if (newContent !== result) {
          result     = newContent;
          didReplace = true;
          break;
        }
      }
    }

    if (!didReplace && category === 'ts_string') {
      // Sostituisce stringhe TS: = "Testo" → = t('chiave')
      const pattern = new RegExp(
        `([:=]\\s*)["'\`]${escapeRegex(str)}["'\`]`,
        'g'
      );
      const newContent = result.replace(pattern, (_, prefix) => {
        return `${prefix}t('${key}')`;
      });
      if (newContent !== result) {
        result     = newContent;
        didReplace = true;
      }
    }

    if (!didReplace && category === 'function_call') {
      // Sostituisce: toast("Testo") → toast(t('chiave'))
      const pattern = new RegExp(
        `(toast|alert|notify|showError|showSuccess)\\s*\\(\\s*["'\`]${escapeRegex(str)}["'\`]`,
        'g'
      );
      const newContent = result.replace(pattern, (_, fn) => {
        return `${fn}(t('${key}')`;
      });
      if (newContent !== result) {
        result     = newContent;
        didReplace = true;
      }
    }

    if (didReplace) {
      replaced++;
      log_items.push({ status: 'ok', str, key });
    } else {
      log_items.push({ status: 'miss', str, key });
    }
  }

  return { content: result, replaced, log_items };
}

// ── Main ──────────────────────────────────────────────────────────────────────

section(DRY_RUN
  ? '🔍 DRY RUN — anteprima modifiche (nessun file verrà scritto)'
  : '⚙️  Conversione automatica .tsx → i18n'
);

if (!DRY_RUN) {
  // Crea cartella backup
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  info(`Backup in: ${BACKUP_DIR}/`);
  log('');
}

let totalFiles    = 0;
let totalReplaced = 0;
let totalSkipped  = 0;
let totalMissed   = 0;

for (const [relPath, findings] of Object.entries(byFile)) {
  const absPath = path.join(srcDir, relPath);

  if (!fs.existsSync(absPath)) {
    warn(`File non trovato (saltato): ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(absPath, 'utf8');
  totalFiles++;

  log(`\n${C.bold}${relPath}${C.reset}  ${C.gray}(${findings.length} stringhe)${C.reset}`);

  // 1. Sostituisce stringhe
  const { content: replaced, replaced: count, log_items } = replaceStrings(content, findings);
  content = replaced;

  // Mostra dettaglio sostituzioni
  for (const item of log_items) {
    if (item.status === 'ok') {
      changed(`  "${item.str}"  →  t('${item.key}')`);
    } else if (item.status === 'skip') {
      skip(`  "${item.str}"  già convertita`);
      totalSkipped++;
    } else {
      warn(`  "${item.str}"  — sostituzione non riuscita (controlla manualmente)`);
      totalMissed++;
    }
  }

  // 2. Aggiunge import
  const { content: withImport, added: importAdded } = addImport(content);
  content = withImport;
  if (importAdded) info(`  + import { useTranslation } aggiunto`);

  // 3. Aggiunge hook
  const { content: withHook, added: hookAdded } = addHook(content);
  content = withHook;
  if (hookAdded) info(`  + const { t } = useTranslation() aggiunto`);

  totalReplaced += count;

  if (!DRY_RUN && count > 0) {
    // Backup del file originale
    const backupPath = path.join(BACKUP_DIR, relPath);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(absPath, backupPath);

    // Scrivi file modificato
    fs.writeFileSync(absPath, content, 'utf8');
    ok(`  Salvato (backup in ${path.join(BACKUP_DIR, relPath)})`);
  } else if (DRY_RUN && count > 0) {
    info(`  [DRY RUN] ${count} sostituzioni da effettuare`);
  } else {
    skip(`  Nessuna modifica necessaria`);
  }
}

// ── Riepilogo ─────────────────────────────────────────────────────────────────

section('📊 Riepilogo');
log(`  File processati:        ${C.bold}${totalFiles}${C.reset}`);
log(`  Stringhe sostituite:    ${C.green}${C.bold}${totalReplaced}${C.reset}`);
log(`  Già convertite (skip):  ${C.gray}${totalSkipped}${C.reset}`);
if (totalMissed > 0) {
  log(`  Da controllare manualm: ${C.yellow}${totalMissed}${C.reset}`);
}

if (DRY_RUN) {
  log(`\n${C.yellow}${C.bold}DRY RUN completato — nessun file modificato.${C.reset}`);
  log(`Per applicare le modifiche esegui:  ${C.cyan}node convert-tsx.js${C.reset}\n`);
} else {
  log(`\n${C.green}${C.bold}Conversione completata!${C.reset}`);
  log(`Backup originali in:  ${C.cyan}${BACKUP_DIR}/${C.reset}`);
  log(`Per ripristinare:     ${C.cyan}node convert-tsx.js --restore${C.reset}`);
  log(`\n${C.bold}Prossimi passi:${C.reset}`);
  log(`  1. Compila le traduzioni in src/locales/en/translation.json`);
  log(`  2. Controlla le ${C.yellow}${totalMissed}${C.reset} stringhe non sostituite automaticamente`);
  log(`  3. Esegui il dev server:  npm run dev`);
  log(`  4. Verifica che tutte le stringhe vengano mostrate correttamente\n`);
}
