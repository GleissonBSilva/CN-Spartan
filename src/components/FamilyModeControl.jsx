import { useState } from 'react';
import { FaShieldAlt, FaLock, FaCheck, FaTimes, FaBan, FaTag, FaPlus, FaTrash } from 'react-icons/fa';
import { useFamilyMode } from '../context/FamilyModeContext';

const POSTER_SM = 'https://image.tmdb.org/t/p/w92';

export default function FamilyModeControl() {
  const {
    isFamilyMode,
    enableFamilyMode,
    disableFamilyMode,
    familyPin,
    setFamilyPin,
    blockedTitles,
    unblockTitle,
    blockedKeywords,
    addBlockedKeyword,
    removeBlockedKeyword,
  } = useFamilyMode();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'blocked' | 'keywords'
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handlePillClick = () => {
    setPinInput('');
    setErrorMsg('');
    setIsChangingPin(false);
    setIsModalOpen(true);
  };

  const handleQuickEnable = () => {
    enableFamilyMode();
    showToast('🛡️ Modo Família Ativado! Conteúdos maduros foram bloqueados.');
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    const result = disableFamilyMode(pinInput);
    if (result.success) {
      setPinInput('');
      showToast('Modo Família Desativado.');
    } else {
      setErrorMsg(result.error);
    }
  };

  const handleSaveNewPin = (e) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setErrorMsg('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    setFamilyPin(newPinInput);
    setIsChangingPin(false);
    setNewPinInput('');
    showToast('Novo PIN salvo com sucesso!');
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;
    addBlockedKeyword(trimmed);
    setNewKeywordInput('');
    showToast(`Filtro "${trimmed}" adicionado!`);
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-[#161a23] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <FaCheck className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Pill Toggle Button */}
      <button
        onClick={handlePillClick}
        title="Gerenciar Modo Família e Títulos Bloqueados"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
          isFamilyMode
            ? 'bg-emerald-600/90 text-white border border-emerald-400/50 shadow-emerald-900/30 ring-2 ring-emerald-500/20'
            : blockedTitles.length > 0 || blockedKeywords.length > 0
              ? 'bg-amber-600/80 text-white border border-amber-400/50 hover:bg-amber-600'
              : 'bg-black/40 text-gray-300 hover:text-white border border-white/10 hover:bg-white/10'
        }`}
      >
        <FaShieldAlt className={isFamilyMode ? 'text-white' : blockedTitles.length > 0 ? 'text-amber-200' : 'text-gray-400'} />
        <span>
          {isFamilyMode
            ? 'Modo Família'
            : blockedTitles.length > 0
              ? `Bloqueios (${blockedTitles.length})`
              : 'Modo Família: OFF'}
        </span>
      </button>

      {/* Parental Control & Block Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151c] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl relative text-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 pb-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
                  <FaShieldAlt />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Controle Familiar & Bloqueios</h3>
                  <p className="text-xs text-gray-400">Proteção de conteúdo e censura personalizada</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-white/10 bg-black/20 px-3">
              <button
                onClick={() => { setActiveTab('general'); setErrorMsg(''); }}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'general'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FaLock className="text-[10px]" />
                <span>Geral & PIN</span>
              </button>

              <button
                onClick={() => { setActiveTab('blocked'); setErrorMsg(''); }}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'blocked'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FaBan className="text-[10px]" />
                <span>Títulos Bloqueados ({blockedTitles.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('keywords'); setErrorMsg(''); }}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'keywords'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FaTag className="text-[10px]" />
                <span>Temas ({blockedKeywords.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">

              {/* TAB 1: GERAL & PIN */}
              {activeTab === 'general' && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Status do Modo Família</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isFamilyMode ? 'Ativado (Ocultando 16+, 18+ e sensíveis)' : 'Desativado'}
                      </p>
                    </div>
                    {isFamilyMode ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                        ATIVO
                      </span>
                    ) : (
                      <button
                        onClick={handleQuickEnable}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow"
                      >
                        Ativar Agora
                      </button>
                    )}
                  </div>

                  {isFamilyMode && (
                    <div className="pt-2">
                      {!isChangingPin ? (
                        <form onSubmit={handleUnlock} className="flex flex-col gap-3">
                          <label className="text-xs font-medium text-gray-300">
                            Para desativar o Modo Família, digite o PIN de 4 dígitos:
                            <span className="block text-[11px] text-gray-500 font-mono mt-0.5">(PIN inicial padrão: {familyPin})</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              maxLength={6}
                              value={pinInput}
                              onChange={(e) => {
                                setPinInput(e.target.value);
                                setErrorMsg('');
                              }}
                              placeholder="PIN"
                              className="flex-1 text-center font-mono py-2 px-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-sm"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow"
                            >
                              Desativar
                            </button>
                          </div>
                          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPin(true);
                              setErrorMsg('');
                            }}
                            className="text-left text-xs text-gray-400 hover:text-white underline mt-1"
                          >
                            Deseja alterar o PIN de segurança?
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleSaveNewPin} className="flex flex-col gap-3">
                          <label className="text-xs font-medium text-gray-300">
                            Defina um novo PIN de 4 a 6 dígitos:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              maxLength={6}
                              value={newPinInput}
                              onChange={(e) => {
                                setNewPinInput(e.target.value);
                                setErrorMsg('');
                              }}
                              placeholder="Novo PIN"
                              className="flex-1 text-center font-mono py-2 px-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingPin(false);
                                setErrorMsg('');
                              }}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs"
                            >
                              Voltar
                            </button>
                          </div>
                          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TÍTULOS BLOQUEADOS */}
              {activeTab === 'blocked' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Filmes e séries bloqueados manualmente são ocultados do catálogo e exigem PIN para assistir.
                  </p>

                  {blockedTitles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs flex flex-col items-center gap-2">
                      <FaBan className="text-3xl text-gray-600" />
                      <p>Nenhum título bloqueado manualmente ainda.</p>
                      <p className="text-[11px] text-gray-500 max-w-xs">
                        Para bloquear qualquer conteúdo, abra a página do filme/série e clique no botão <strong>&quot;Bloquear Título&quot;</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5 max-h-72 overflow-y-auto custom-scrollbar">
                      {blockedTitles.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.poster_path ? (
                              <img
                                src={item.poster_path.startsWith('http') ? item.poster_path : `${POSTER_SM}${item.poster_path}`}
                                alt={item.title}
                                className="w-8 h-11 object-cover rounded shadow ring-1 ring-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-11 bg-white/5 rounded flex items-center justify-center shrink-0">
                                <FaBan className="text-xs text-gray-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                              <span className="text-[10px] text-red-400 font-semibold uppercase">Bloqueado</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              unblockTitle(item.id);
                              showToast(`"${item.title}" foi desbloqueado.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-600 text-gray-300 hover:text-white text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                            title="Desbloquear este título"
                          >
                            <FaTrash className="text-[10px]" />
                            <span>Desbloquear</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PALAVRAS-CHAVE / TEMAS */}
              {activeTab === 'keywords' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Bloqueie automaticamente qualquer filme ou série que contenha determinadas palavras no título ou na sinopse (ex: temas ideológicos, violência, terror específico, etc.):
                  </p>

                  <form onSubmit={handleAddKeyword} className="flex gap-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      placeholder="Ex: ideologia, terror, etc."
                      className="flex-1 py-2 px-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <FaPlus className="text-[10px]" />
                      <span>Adicionar</span>
                    </button>
                  </form>

                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Filtros Ativos ({blockedKeywords.length})
                    </p>

                    {blockedKeywords.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Nenhum tema personalizado adicionado.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {blockedKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium"
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => {
                                removeBlockedKeyword(kw);
                                showToast(`Filtro "${kw}" removido.`);
                              }}
                              className="text-red-400 hover:text-white p-0.5 rounded-full"
                              title="Remover filtro"
                            >
                              <FaTimes className="text-[9px]" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
