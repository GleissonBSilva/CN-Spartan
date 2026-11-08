import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BiGlobe } from 'react-icons/bi';
import { FaCheck } from 'react-icons/fa';

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, languages } = useLanguage();
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Alterar Idioma / Change Language"
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 focus:outline-none ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white'
            : 'px-3 py-2 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white shadow-sm'
        }`}
      >
        <BiGlobe className="text-base text-red-400 shrink-0" />
        <span className="text-sm shrink-0">{currentLang.flag}</span>
        <span className="font-medium tracking-wide">{currentLang.short}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-44 rounded-xl bg-[#121620] border border-white/10 shadow-2xl z-50 overflow-hidden py-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5">
            Idioma / Language
          </div>
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
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {isSelected && <FaCheck className="text-xs text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
