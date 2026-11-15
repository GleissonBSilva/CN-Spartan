/**
 * Catálogo "Originais Spartan": filmes abertos da Blender Foundation (Creative Commons BY).
 * A licença CC-BY permite exibir e criar obras derivadas (ex.: dublagem pt-BR),
 * desde que os créditos sejam mantidos.
 *
 * Os arquivos HLS são gerados localmente por scripts/dub/package-hls.mjs em
 * public/originals/<slug>/master.m3u8 (pasta ignorada pelo git).
 */
export const ORIGINALS = [
  {
    slug: 'sintel',
    title: 'Sintel',
    year: 2010,
    description:
      'Uma jovem atravessa terras perigosas em busca do pequeno dragão que criou e perdeu.',
    license: 'CC BY 3.0',
    credit: '© Blender Foundation | durian.blender.org',
    sourceUrl: 'https://durian.blender.org/',
  },
  {
    slug: 'tears-of-steel',
    title: 'Tears of Steel',
    year: 2012,
    description:
      'Em uma Amsterdã futurista, cientistas tentam salvar o mundo de robôs gigantes.',
    license: 'CC BY 3.0',
    credit: '© Blender Foundation | mango.blender.org',
    sourceUrl: 'https://mango.blender.org/',
  },
  {
    slug: 'elephants-dream',
    title: 'Elephants Dream',
    year: 2006,
    description:
      'Dois personagens exploram uma máquina gigantesca e surreal com visões opostas sobre ela.',
    license: 'CC BY 2.5',
    credit: '© Blender Foundation | orange.blender.org',
    sourceUrl: 'https://orange.blender.org/',
  },
];

const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export const getOriginalManifest = (slug) =>
  SLUG_RE.test(slug) ? `/originals/${slug}/master.m3u8` : '';
