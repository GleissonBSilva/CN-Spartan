#!/usr/bin/env node
/**
 * Empacota um filme em HLS com duas faixas de áudio (pt-BR dublado + original).
 *
 * Uso:
 *   node scripts/dub/package-hls.mjs --slug sintel --video C:\filmes\sintel.mp4 --dub C:\filmes\sintel_ptbr.wav
 *
 * Opções:
 *   --slug   (obrigatório) a-z, 0-9 e hífen. Saída: public/originals/<slug>/
 *   --video  (obrigatório) arquivo de vídeo com o áudio original (inglês)
 *   --dub    (obrigatório) arquivo de áudio com a dublagem pt-BR (wav/mp3/m4a)
 *   --test-dub  gera um tom de teste no lugar da dublagem (só para validar o player)
 *
 * Requisito: ffmpeg no PATH (versão 6 ou superior recomendada).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

function fail(msg) {
  console.error(`\n[erro] ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--test-dub') {
      out.testDub = true;
    } else if (arg.startsWith('--')) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) fail(`Valor ausente para ${arg}`);
      out[arg.slice(2)] = value;
      i += 1;
    }
  }
  return out;
}

function assertFile(label, p) {
  if (!p) fail(`Informe --${label}`);
  const abs = path.resolve(p);
  if (!existsSync(abs) || !statSync(abs).isFile()) fail(`Arquivo não encontrado (--${label}): ${abs}`);
  return abs;
}

const args = parseArgs(process.argv.slice(2));

if (!args.slug || !SLUG_RE.test(args.slug)) fail('--slug inválido (use a-z, 0-9 e hífen).');
const videoPath = assertFile('video', args.video);
const dubPath = args.testDub ? null : assertFile('dub', args.dub);

const ffCheck = spawnSync('ffmpeg', ['-hide_banner', '-version'], { encoding: 'utf8' });
if (ffCheck.error || ffCheck.status !== 0) {
  fail('ffmpeg não encontrado no PATH. Instale com: winget install Gyan.FFmpeg (e reabra o terminal).');
}

const outDir = path.join(ROOT, 'public', 'originals', args.slug);
try {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
} catch (err) {
  fail(`Não foi possível preparar a pasta de saída ${outDir}: ${err.message}`);
}

const dubInput = args.testDub
  ? ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000']
  : ['-i', dubPath];

// Faixa 0 do var_stream_map = vídeo; 1 = pt-BR (padrão); 2 = original
const ffArgs = [
  '-hide_banner', '-y',
  '-i', videoPath,
  ...dubInput,
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-map', '0:a:0',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p',
  '-force_key_frames', 'expr:gte(t,n_forced*6)',
  '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '48000',
  '-shortest',
  '-f', 'hls',
  '-hls_time', '6',
  '-hls_playlist_type', 'vod',
  '-hls_segment_filename', path.join(outDir, '%v', 'seg_%03d.ts'),
  '-master_pl_name', 'master.m3u8',
  '-var_stream_map',
  'v:0,agroup:aud a:0,agroup:aud,language:pt-BR,name:Português_(BR),default:yes a:1,agroup:aud,language:en,name:Inglês_(original)',
  path.join(outDir, '%v', 'index.m3u8'),
];

console.log(`[info] Gerando HLS em ${outDir} ...`);
const run = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });

if (run.error) fail(`Falha ao executar ffmpeg: ${run.error.message}`);
if (run.status !== 0) fail(`ffmpeg terminou com código ${run.status}. Veja o log acima.`);
if (!existsSync(path.join(outDir, 'master.m3u8'))) fail('master.m3u8 não foi gerado.');

console.log(`\n[ok] Pronto: /originals/${args.slug}/master.m3u8`);
