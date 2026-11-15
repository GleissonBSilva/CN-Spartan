import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// Converte timestamp SRT 00:01:47,250 para segundos
function srtTimeToSeconds(timeStr) {
  const [hms, ms] = timeStr.trim().split(',');
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s + Number(ms) / 1000;
}

// Faz parse do SRT anotado com {H} para personagem homem ou voz feminina padrão
function parseSrt(content) {
  const blocks = content.trim().split(/\r?\n\r?\n/);
  const items = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;
    
    // Linha 1 = index
    // Linha 2 = timestamp
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;

    const startSec = srtTimeToSeconds(timeMatch[1]);
    const textRaw = lines.slice(2).join(' ');
    const isMale = textRaw.startsWith('{H}');
    const cleanText = textRaw.replace('{H}', '').trim();

    items.push({
      start: startSec,
      text: cleanText,
      voice: 'Microsoft Maria Desktop', // Maria Desktop (pt-BR instalada no Windows)
      pitch: isMale ? -4 : 1 // pitch ajustado no áudio para diferenciar vozes
    });
  }
  return items;
}

async function main() {
  const srtPath = path.join(__dirname, 'sintel', 'sintel_ptbr.srt');
  const meAudio = path.join(ROOT, 'media-src', 'sintel', 'sintel-me.flac');
  const outWav = path.join(ROOT, 'media-src', 'sintel', 'sintel_ptbr_full.wav');
  const tempDir = path.join(ROOT, 'media-src', 'sintel', 'temp_voices');

  if (!existsSync(srtPath)) {
    console.error('SRT não encontrado:', srtPath);
    process.exit(1);
  }
  if (!existsSync(meAudio)) {
    console.error('M&E áudio (trilha de fundo) não encontrado:', meAudio);
    process.exit(1);
  }

  mkdirSync(tempDir, { recursive: true });

  const subs = parseSrt(readFileSync(srtPath, 'utf8'));
  console.log(`[1/3] Sintetizando ${subs.length} falas em português (Maria Desktop)...`);

  const jobs = subs.map((sub, idx) => ({
    text: sub.text,
    file: path.join(tempDir, `line_${String(idx).padStart(3, '0')}.wav`)
  }));

  const jobsJsonPath = path.join(tempDir, 'jobs.json');
  writeFileSync(jobsJsonPath, JSON.stringify(jobs, null, 2), 'utf8');

  // Executa sintetizador PowerShell
  const ps1Path = path.join(__dirname, 'synth.ps1');
  const psRun = spawnSync('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-File', ps1Path,
    '-Jobs', jobsJsonPath,
    '-Voice', 'Microsoft Maria Desktop'
  ], { stdio: 'inherit' });

  if (psRun.status !== 0) {
    console.error('Erro na síntese das vozes.');
    process.exit(1);
  }

  console.log('[2/3] Posicionando falas nos timestamps exatos e mixando com a trilha original...');

  // Constrói filtro complexo do ffmpeg com amix / adelay
  const inputs = ['-i', meAudio];
  const filterParts = [];
  const mixInputs = ['[0:a]'];

  subs.forEach((sub, idx) => {
    const filePath = jobs[idx].file;
    inputs.push('-i', filePath);
    const inIndex = idx + 1;
    const delayMs = Math.round(sub.start * 1000);
    
    // Se for homem ({H}), reduz o tom (rubberband ou asetrate/atempo) para dar voz grave masculina
    let chain = `[${inIndex}:a]adelay=${delayMs}|${delayMs}`;
    if (sub.pitch < 0) {
      chain += `,asetrate=48000*0.82,atempo=1/0.82,volume=1.8[a${idx}]`;
    } else {
      chain += `,volume=1.5[a${idx}]`;
    }
    filterParts.push(chain);
    mixInputs.push(`[a${idx}]`);
  });

  filterParts.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=2[outa]`);

  const ffArgs = [
    '-hide_banner', '-y',
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[outa]',
    '-c:a', 'pcm_s16le',
    outWav
  ];

  const ffRun = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });
  if (ffRun.status !== 0) {
    console.error('Erro na mixagem do áudio final.');
    process.exit(1);
  }

  console.log(`\n[3/3] Áudio dublado 100% completo gerado com sucesso em:\n${outWav}\n`);
}

main().catch(console.error);
