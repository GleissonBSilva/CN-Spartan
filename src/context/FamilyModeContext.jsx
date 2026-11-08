import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FamilyModeContext = createContext(null);

// Certifications considered mature/unsafe for family mode
const RESTRICTED_CERTIFICATIONS = new Set([
  '16', '18', 'R', 'NC-17', 'TV-MA', 'X', 'XXX', 'AO'
]);

// Sensitive/mature default keywords
const DEFAULT_RESTRICTED_TERMS = [
  'erótico', 'erotico', 'pornô', 'porno', 'sexo explícito',
  'nudez explícita', 'orgia', 'massacre explícito',
  'erotic', 'explicit sex', 'hardcore', 'sadomasoquismo'
];

export const FamilyModeProvider = ({ children }) => {
  const [isFamilyMode, setIsFamilyMode] = useState(() => {
    return localStorage.getItem('weflix_family_mode') === 'true';
  });

  const [familyPin, setFamilyPinState] = useState(() => {
    return localStorage.getItem('weflix_family_pin') || '1234';
  });

  // Manually blocked titles by the user: array of { id, title, poster_path, mediaType, date }
  const [blockedTitles, setBlockedTitles] = useState(() => {
    try {
      const saved = localStorage.getItem('weflix_blocked_titles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User-defined blocked keywords / topics / agendas
  const [blockedKeywords, setBlockedKeywords] = useState(() => {
    try {
      const saved = localStorage.getItem('weflix_blocked_keywords');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('weflix_family_mode', String(isFamilyMode));
  }, [isFamilyMode]);

  const setFamilyPin = useCallback((newPin) => {
    const cleaned = String(newPin).slice(0, 6);
    setFamilyPinState(cleaned);
    localStorage.setItem('weflix_family_pin', cleaned);
  }, []);

  const enableFamilyMode = useCallback(() => {
    setIsFamilyMode(true);
  }, []);

  const disableFamilyMode = useCallback((inputPin) => {
    if (inputPin === familyPin) {
      setIsFamilyMode(false);
      return { success: true };
    }
    return { success: false, error: 'PIN incorreto. Tente novamente.' };
  }, [familyPin]);

  const toggleFamilyMode = useCallback((inputPin) => {
    if (!isFamilyMode) {
      setIsFamilyMode(true);
      return { success: true };
    }
    return disableFamilyMode(inputPin);
  }, [isFamilyMode, disableFamilyMode]);

  // Check if an item is manually blocked by ID
  const isTitleBlocked = useCallback((itemOrId) => {
    if (!itemOrId) return false;
    const targetId = String(typeof itemOrId === 'object' ? (itemOrId.id ?? itemOrId.mediaId) : itemOrId);
    return blockedTitles.some((b) => String(b.id) === targetId);
  }, [blockedTitles]);

  // Block a title
  const blockTitle = useCallback((item) => {
    if (!item) return;
    const targetId = String(item.id ?? item.mediaId);
    if (!targetId || targetId === 'undefined') return;

    setBlockedTitles((prev) => {
      if (prev.some((b) => String(b.id) === targetId)) return prev;
      const updated = [
        {
          id: targetId,
          title: item.title || item.name || 'Título Sem Nome',
          poster_path: item.poster_path || item.poster || null,
          mediaType: item.mediaType || item.media_type || (item.title ? 'movie' : 'tv'),
          date: new Date().toISOString(),
        },
        ...prev,
      ];
      localStorage.setItem('weflix_blocked_titles', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Unblock a title
  const unblockTitle = useCallback((itemOrId) => {
    const targetId = String(typeof itemOrId === 'object' ? (itemOrId.id ?? itemOrId.mediaId) : itemOrId);
    setBlockedTitles((prev) => {
      const updated = prev.filter((b) => String(b.id) !== targetId);
      localStorage.setItem('weflix_blocked_titles', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Add custom blocked keyword
  const addBlockedKeyword = useCallback((rawWord) => {
    const word = String(rawWord).trim().toLowerCase();
    if (!word) return;
    setBlockedKeywords((prev) => {
      if (prev.includes(word)) return prev;
      const updated = [...prev, word];
      localStorage.setItem('weflix_blocked_keywords', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove custom blocked keyword
  const removeBlockedKeyword = useCallback((rawWord) => {
    const word = String(rawWord).trim().toLowerCase();
    setBlockedKeywords((prev) => {
      const updated = prev.filter((w) => w !== word);
      localStorage.setItem('weflix_blocked_keywords', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Evaluates if a given movie or TV show item should be restricted
   */
  const isContentRestricted = useCallback((item) => {
    if (!item) return false;

    // 1. Check if manually blocked by user
    if (isTitleBlocked(item)) return true;

    const textToCheck = `${item.title || ''} ${item.name || ''} ${item.overview || ''}`.toLowerCase();

    // 2. Check user-defined blocked keywords
    if (blockedKeywords.length > 0) {
      for (const kw of blockedKeywords) {
        if (kw && textToCheck.includes(kw)) return true;
      }
    }

    // 3. If Family Mode is active, check certifications and adult ratings
    if (isFamilyMode) {
      if (item.adult) return true;

      const checkCert = (cert) => {
        if (!cert) return false;
        const clean = String(cert).toUpperCase().trim();
        return RESTRICTED_CERTIFICATIONS.has(clean);
      };

      if (item.certification && checkCert(item.certification)) return true;

      if (item.release_dates?.results) {
        for (const country of item.release_dates.results) {
          if (country.iso_3166_1 === 'BR' || country.iso_3166_1 === 'US') {
            for (const rd of country.release_dates || []) {
              if (checkCert(rd.certification)) return true;
            }
          }
        }
      }

      if (item.content_ratings?.results) {
        for (const cr of item.content_ratings.results) {
          if (cr.iso_3166_1 === 'BR' || cr.iso_3166_1 === 'US') {
            if (checkCert(cr.rating)) return true;
          }
        }
      }

      for (const term of DEFAULT_RESTRICTED_TERMS) {
        if (textToCheck.includes(term)) return true;
      }
    }

    return false;
  }, [isFamilyMode, isTitleBlocked, blockedKeywords]);

  /**
   * Filter an array of items, excluding restricted or blocked ones
   */
  const filterFamilyItems = useCallback((items) => {
    if (!Array.isArray(items)) return items;
    // Always filter manually blocked titles / custom keywords, and filter mature content if family mode is on
    return items.filter((item) => !isContentRestricted(item));
  }, [isContentRestricted]);

  return (
    <FamilyModeContext.Provider
      value={{
        isFamilyMode,
        familyPin,
        enableFamilyMode,
        disableFamilyMode,
        toggleFamilyMode,
        setFamilyPin,
        isContentRestricted,
        filterFamilyItems,
        // Block actions
        blockedTitles,
        blockedKeywords,
        blockTitle,
        unblockTitle,
        isTitleBlocked,
        addBlockedKeyword,
        removeBlockedKeyword,
      }}
    >
      {children}
    </FamilyModeContext.Provider>
  );
};

export const useFamilyMode = () => {
  const context = useContext(FamilyModeContext);
  if (!context) {
    throw new Error('useFamilyMode must be used within a FamilyModeProvider');
  }
  return context;
};
