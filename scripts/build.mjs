import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as terser } from 'terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const SRC = 'src';
const OUT = 'dist';
const OBFUSCATE = process.argv.includes('--obfuscate');

const OBF_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  renameGlobals: false,
  renameProperties: false,
  stringArray: true,
  stringArrayThreshold: 0.5,
  stringArrayEncoding: [],
  identifierNamesGenerator: 'hexadecimal',
  sourceMap: false,
};

async function processJs(code, label, obfuscate) {
  const min = await terser(code, { compress: true, mangle: true });
  let out = min.code;
  if (obfuscate) {
    out = JavaScriptObfuscator.obfuscate(out, OBF_OPTIONS).getObfuscatedCode();
  }
  new vm.Script(out, { filename: label });
  return out;
}

const size = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(SRC, OUT, { recursive: true });

const html = readFileSync(join(SRC, 'index.html'), 'utf8');
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let result = '';
let last = 0;
let count = 0;

for (const m of html.matchAll(re)) {
  const [full, attrs, code] = m;
  result += html.slice(last, m.index);
  last = m.index + full.length;

  const hasSrc = /\bsrc\s*=/i.test(attrs);
  const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
  const isClassicJs = !type || /^(text|application)\/javascript$/i.test(type);

  if (hasSrc || !isClassicJs || !code.trim()) {
    result += full;
    continue;
  }
  count += 1;
  const out = await processJs(code, `inline-script-${count}`, OBFUSCATE);
  result += `<script${attrs}>${out}</script>`;
}
result += html.slice(last);

const finalHtml = await minifyHtml(result, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: false,
});
writeFileSync(join(OUT, 'index.html'), finalHtml);
console.log(`index.html: ${size(html)} -> ${size(finalHtml)} (${count} script blocks, obfuscate=${OBFUSCATE})`);

try {
  const sw = readFileSync(join(SRC, 'sw.js'), 'utf8');
  const swOut = await processJs(sw, 'sw.js', false);
  writeFileSync(join(OUT, 'sw.js'), swOut);
  console.log(`sw.js: ${size(sw)} -> ${size(swOut)}`);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  console.warn('No src/sw.js found, skipping service worker.');
}

console.log(`Done. Deploy the "${OUT}" folder.`);
