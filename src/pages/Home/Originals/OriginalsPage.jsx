import { useState, useEffect } from 'react';
import MultiAudioPlayer from '../../../components/MultiAudioPlayer';
import { ORIGINALS, getOriginalManifest } from '../../../data/originals';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

function OriginalsPage() {
  const [selected, setSelected] = useState(ORIGINALS[0] || null);
  const { isActive, isAdmin, isSuspended, isExpired, refreshProfile } = useAuthProfile();

  useEffect(() => {
    refreshProfile?.();
  }, []);

  const canPlay = !isSuspended && !isExpired && (isAdmin || isActive);

  return (
    <div className="min-h-screen px-4 md:px-10 pt-24 pb-16 text-white">
      <h1 className="text-2xl md:text-3xl font-black mb-1">Originais Spartan</h1>
      <p className="text-sm text-gray-400 mb-6">
        Filmes Creative Commons com dublagem em Português (BR) e áudio original.
      </p>

      {selected && (
        <section className="mb-10 max-w-5xl">
          {!canPlay ? (
            <SubscriptionLockGate title={selected.title} />
          ) : (
            <MultiAudioPlayer
              key={selected.slug}
              src={getOriginalManifest(selected.slug)}
              title={selected.title}
            />
          )}
          <div className="mt-4">
            <h2 className="text-xl font-bold">
              {selected.title} <span className="text-gray-400 font-normal">({selected.year})</span>
            </h2>
            <p className="text-sm text-gray-300 mt-1">{selected.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              {selected.credit} · Licença {selected.license} ·{' '}
              <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                fonte
              </a>{' '}
              · Dublagem pt-BR: obra derivada (CINE SPARTAN)
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl">
        {ORIGINALS.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setSelected(item)}
            className={`text-left rounded-lg p-4 bg-zinc-900 hover:bg-zinc-800 border transition ${
              selected?.slug === item.slug ? 'border-red-600' : 'border-white/10'
            }`}
          >
            <p className="font-bold">{item.title}</p>
            <p className="text-xs text-gray-400">
              {item.year} · {item.license}
            </p>
            <p className="text-[11px] text-red-400 mt-2 font-semibold">🇧🇷 Dublado · 🇺🇸 Original</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default OriginalsPage;
