import {createHash} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';

const USER_AGENT = 'ProgrammingVideoEngine/0.2 (+https://github.com/jbqneto/programing-video-engine)';
const POLY_HAVEN = 'https://api.polyhaven.com';
const AMBIENT_CG = 'https://ambientcg.com/api/v3/assets';
const VALID_TYPES = ['models', 'textures', 'hdris'];
const VALID_FORMATS = ['glb', 'gltf', 'blend', 'fbx', 'obj', 'hdr', 'exr', 'png', 'jpg', 'jpeg', 'zip'];

export const validateAssetId = (id) => {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) {
    throw new Error('Invalid asset ID: use only letters, numbers, underscore or hyphen.');
  }
  return id;
};

export function normalizePolyHavenAssets(data, query = '', limit = 10) {
  const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return Object.entries(data)
    .filter(([id, item]) => {
      const text = [id, item.name, item.description, ...(Array.isArray(item.tags) ? item.tags : [])]
        .filter(Boolean).join(' ').toLowerCase();
      return keywords.every((word) => text.includes(word));
    })
    .slice(0, limit)
    .map(([id, item]) => ({
      id,
      title: item.name ?? id,
      category: item.category ?? null,
      type: item.type === 0 ? 'hdri' : item.type === 1 ? 'texture' : 'model',
      sourceUrl: 'https://polyhaven.com/a/' + encodeURIComponent(id),
      license: 'CC0-1.0',
      thumbnail: item.thumbnail_url ?? null
    }));
}

export function normalizeAmbientCgAssets(data) {
  return (Array.isArray(data.assets) ? data.assets : []).map((item) => ({
    id: item.id,
    title: item.title ?? item.id,
    type: item.type ?? null,
    sourceUrl: item.url ?? 'https://ambientcg.com/view?id=' + encodeURIComponent(item.id),
    license: 'CC0-1.0',
  }));
}

export function flattenPolyHavenFiles(data, parts = []) {
  if (!data || typeof data !== 'object') return [];
  if (typeof data.url === 'string') {
    return [{path: parts.join('/'), url: data.url, size: data.size ?? null, md5: data.md5 ?? null,
      hasDependencies: Boolean(data.include && Object.keys(data.include).length)}];
  }
  return Object.entries(data)
    .filter(([key]) => key !== 'include')
    .flatMap(([key, value]) => flattenPolyHavenFiles(value, [...parts, key]));
}

export function choosePolyHavenFile(files, {format = 'glb', resolution = '1k'} = {}) {
  const extension = String(format).toLowerCase();
  if (!VALID_FORMATS.includes(extension)) throw new Error('Unsupported format: ' + extension);
  const candidates = files.filter((entry) => {
    try { return new URL(entry.url).pathname.toLowerCase().endsWith('.' + extension); }
    catch { return false; }
  });
  if (!candidates.length) throw new Error('No .' + extension + ' file is available. Run "assets files polyhaven <id>" first.');
  const preferred = candidates.filter((entry) => entry.path.toLowerCase().split('/').includes(resolution.toLowerCase()));
  const pool = preferred.length ? preferred : candidates;
  return [...pool].sort((a, b) => (a.size ?? Infinity) - (b.size ?? Infinity))[0];
}

const flag = (argv, name, fallback) => {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error('Missing value for ' + name);
  return argv[index + 1];
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: {'User-Agent': USER_AGENT, Accept: 'application/json'},
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error('Request failed (' + response.status + '): ' + url);
  return response.json();
}

function readMb(argv) {
  const value = Number(flag(argv, '--max-mb', '128'));
  if (!Number.isFinite(value) || value < 1 || value > 2048) {
    throw new Error('--max-mb must be between 1 and 2048.');
  }
  return Math.floor(value * 1024 * 1024);
}

async function fileMd5(file) {
  const hash = createHash('md5');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function downloadPolyHavenFile(id, entry, maxBytes = 128 * 1024 * 1024) {
  validateAssetId(id);
  const url = new URL(entry.url);
  if (url.protocol !== 'https:' || url.hostname !== 'dl.polyhaven.org') {
    throw new Error('Refusing download from a non-Poly Haven host.');
  }
  const name = basename(decodeURIComponent(url.pathname));
  if (!/^[\w. -]+$/.test(name) || name === '.' || name === '..') throw new Error('Invalid filename.');
  if (entry.hasDependencies) throw new Error('This format has external dependencies. Choose a standalone GLB/HDR/ZIP, or import it manually.');
  if (Number.isFinite(entry.size) && entry.size > maxBytes) {
    throw new Error('File exceeds --max-mb; increase the limit explicitly if needed.');
  }
  const directory = resolve('public', 'assets', 'polyhaven', id);
  mkdirSync(directory, {recursive: true});
  const destination = join(directory, name);
  if (existsSync(destination)) {
    if (entry.md5 && (await fileMd5(destination)).toLowerCase() !== entry.md5.toLowerCase()) {
      throw new Error('Existing file failed MD5 verification: ' + destination);
    }
    return {status: 'cached', file: destination, sourceUrl: 'https://polyhaven.com/a/' + id};
  }
  const temp = destination + '.partial';
  try {
    const response = await fetch(url, {headers: {'User-Agent': USER_AGENT}, signal: AbortSignal.timeout(180000)});
    if (!response.ok || !response.body) throw new Error('Asset download failed: HTTP ' + response.status);
    let received = 0;
    const limiter = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        callback(received > maxBytes ? new Error('Download exceeded --max-mb.') : null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(response.body), limiter, createWriteStream(temp));
    const digest = await fileMd5(temp);
    if (entry.md5 && digest.toLowerCase() !== entry.md5.toLowerCase()) {
      throw new Error('Downloaded file failed MD5 verification.');
    }
    renameSync(temp, destination);
    writeFileSync(destination + '.source.json', JSON.stringify({
      provider: 'polyhaven', assetId: id, sourceUrl: 'https://polyhaven.com/a/' + id,
      license: 'CC0-1.0', apiCredit: 'Powered by Poly Haven',
      originalDownloadUrl: entry.url, path: entry.path, bytes: received, md5: digest,
      retrievedAt: new Date().toISOString()
    }, null, 2) + '\n');
    return {status: 'downloaded', file: destination, bytes: received, md5: digest};
  } finally {
    rmSync(temp, {force: true});
  }
}

export async function main(argv = process.argv.slice(2)) {
  const [command, provider, term] = argv;
  if (!['search', 'files', 'download'].includes(command) || !['polyhaven', 'ambientcg'].includes(provider) || !term) {
    throw new Error('Usage: npm run assets -- <search|files|download> <polyhaven|ambientcg> <query|id> [--type models|textures|hdris] [--limit 10] [--format glb] [--resolution 1k] [--max-mb 128]');
  }
  const limit = Number(flag(argv, '--limit', '10'));
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('--limit must be an integer from 1 to 100.');

  if (provider === 'polyhaven') {
    console.error('Powered by Poly Haven — https://polyhaven.com (CC0 assets).');
    if (command === 'search') {
      const type = flag(argv, '--type', 'models');
      if (!VALID_TYPES.includes(type)) throw new Error('Poly Haven --type must be models, textures or hdris.');
      const url = new URL(POLY_HAVEN + '/assets');
      url.searchParams.set('type', type);
      const items = normalizePolyHavenAssets(await getJson(url), term, limit);
      console.log(JSON.stringify({provider, query: term, count: items.length, assets: items}, null, 2));
      return;
    }
    const id = validateAssetId(term);
    const files = flattenPolyHavenFiles(await getJson(POLY_HAVEN + '/files/' + encodeURIComponent(id)));
    if (command === 'files') {
      console.log(JSON.stringify({provider, id, files}, null, 2));
      return;
    }
    const entry = choosePolyHavenFile(files, {
      format: flag(argv, '--format', 'glb'),
      resolution: flag(argv, '--resolution', '1k'),
    });
    console.log(JSON.stringify(await downloadPolyHavenFile(id, entry, readMb(argv)), null, 2));
    return;
  }

  if (command === 'download') {
    throw new Error('Automated ambientCG downloads are not supported yet; use "files ambientcg <id>" to inspect available download links.');
  }
  const url = new URL(AMBIENT_CG);
  if (command === 'search') {
    url.searchParams.set('q', term);
    const type = flag(argv, '--type', '');
    if (type) url.searchParams.set('type', type);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('include', 'title,type,url');
    const data = await getJson(url);
    console.log(JSON.stringify({provider, query: term, count: data.totalResults ?? null,
      assets: normalizeAmbientCgAssets(data)}, null, 2));
    return;
  }
  validateAssetId(term);
  url.searchParams.set('id', term);
  url.searchParams.set('limit', '1');
  url.searchParams.set('include', 'title,type,url,downloads');
  const data = await getJson(url);
  console.log(JSON.stringify({provider, id: term, asset: data.assets?.[0] ?? null}, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('[assets] ' + error.message);
    process.exitCode = 1;
  });
}
