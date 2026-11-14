/**
 * Genera src/components/icons-bundle.json con SOLO los iconos usados en Icon.jsx.
 * Así los iconos van dentro de la app y no se descargan de api.iconify.design
 * cada vez que alguien abre la página.
 *
 * Ejecutar después de agregar o cambiar iconos en ICONIFY_ICONS:
 *   npm run icons
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getIcons } from '@iconify/utils';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconSource = readFileSync(join(root, 'src/components/Icon.jsx'), 'utf8');
const mapBlock = iconSource.match(/ICONIFY_ICONS = \{([\s\S]*?)\n\};/);
if (!mapBlock) throw new Error('No se encontró ICONIFY_ICONS en Icon.jsx');

const names = [...mapBlock[1].matchAll(/'([a-z0-9-]+):([a-z0-9-]+)'/g)];
const byPrefix = new Map();
for (const [, prefix, name] of names) {
  if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set());
  byPrefix.get(prefix).add(name);
}

const bundle = [];
for (const [prefix, iconNames] of byPrefix) {
  const fullSet = JSON.parse(
    readFileSync(join(root, `node_modules/@iconify-json/${prefix}/icons.json`), 'utf8'),
  );
  const subset = getIcons(fullSet, [...iconNames]);
  const missing = [...iconNames].filter((n) => !subset?.icons?.[n] && !subset?.aliases?.[n]);
  if (missing.length) throw new Error(`Iconos inexistentes en ${prefix}: ${missing.join(', ')}`);
  bundle.push(subset);
}

const out = join(root, 'src/components/icons-bundle.json');
writeFileSync(out, `${JSON.stringify(bundle)}\n`);
console.log(`icons-bundle.json: ${names.length} referencias, ${bundle.length} colecciones`);
