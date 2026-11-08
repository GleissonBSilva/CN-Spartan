import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BiGlobe, BiChevronDown } from 'react-icons/bi';
import { FaCheck } from 'react-icons/fa';

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, cycleLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // In compact mode (like in the collapsed sidebar), clicking directly cycles through languages with 1 click
  const handleCompactClick = (e) => {
    e.stopPropagation();
    if (compact) {
      cycleLanguage();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={compact ? handleCompactClick : () => setIsOpen(!isOpen)}
        title={`Idioma atual: ${currentLang.label} (Clique para alterar)`}
        className={`group flex items-center gap-2 rounded-xl transition-all duration-200 focus:outline-none select-none ${
          compact
            ? 'px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white hover:border-red-500/30 shadow-sm'
            : 'px-3.5 py-2 text-xs font-semibold bg-gray-900/90 hover:bg-gray-800/90 border border-white/15 hover:border-red-500/40 text-white shadow-lg backdrop-blur-md hover:shadow-red-950/30'
        }`}
      >
        <BiGlobe className="text-base text-red-400 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
        <span className="text-base leading-none shrink-0">{currentLang.flag}</span>
        <span className="font-bold tracking-wider uppercase text-[11px]">{currentLang.short}</span>
        {!compact && (
          <BiChevronDown className={`text-sm text-gray-400 group-hover:text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu (Fixed in viewport when compact or absolute when standard) */}
      {isOpen && !compact && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-56 rounded-2xl bg-[#0f141f]/95 border border-white/15 shadow-2xl z-50 overflow-hidden py-1.5 backdrop-blur-2xl ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Idioma / Language
            </span>
            <span className="text-[9px] text-gray-500 font-medium">TMDB & UI</span>
          </div>
          <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-all ${
                    isSelected
                      ? 'bg-red-600/20 text-red-400 font-bold border-l-2 border-red-500'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </div>
                  {isSelected && <FaCheck className="text-xs text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-1.5 bg-black/40 border-t border-white/5 text-[9px] text-gray-400 leading-tight">
            * Sinopses e títulos carregados conforme disponibilidade no catálogo.
          </div>
        </div>
      )}
    </div>
  );
}
