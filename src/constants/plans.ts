export interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  screens: number;
  quality: string;
  description: string;
  adminOnly?: boolean;
}

export const DEFAULT_PLANS: PlanTier[] = [
  {
    id: 'start',
    name: 'SPARTAN START',
    monthlyPrice: 29.9,
    annualPrice: 25.0,
    screens: 1,
    quality: 'Full HD & 4K Ultra HD',
    description: '1 tela individual para smartphone, tablet, PC ou TV Box.',
  },
  {
    id: 'fundador',
    name: 'SPARTAN FUNDADOR',
    badge: '🛡️ VIP Fundador',
    monthlyPrice: 34.9,
    annualPrice: 29.9,
    screens: 3,
    quality: 'Full HD & 4K Ultra HD VIP',
    description: 'Condição exclusiva vitalícia reservada apenas para clientes fundadores e pioneiros, liberada diretamente pela administração Spartan (3 telas simultâneas).',
    adminOnly: true,
  },
  {
    id: 'pro',
    name: 'SPARTAN PRO',
    badge: 'Mais Escolhido',
    monthlyPrice: 59.9,
    annualPrice: 50.0,
    screens: 2,
    quality: 'Full HD & 4K Ultra HD',
    description: '2 telas simultâneas para Smart TV, TV Box e família.',
  },
  {
    id: 'business',
    name: 'SPARTAN BUSINESS',
    badge: 'Família VIP',
    monthlyPrice: 119.9,
    annualPrice: 99.9,
    screens: 5,
    quality: 'Full HD & 4K Ultra HD',
    description: '5 telas simultâneas em qualquer dispositivo com suporte prioritário.',
  },
];

export const ensureFounderPlan = (list: PlanTier[]): PlanTier[] => {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_PLANS;
  if (!list.some((p) => p.id === 'fundador' || p.name.toUpperCase().includes('FUNDADOR'))) {
    const founder = DEFAULT_PLANS.find((p) => p.id === 'fundador');
    if (founder) {
      const copy = [...list];
      copy.splice(1, 0, founder);
      return copy;
    }
  }
  return list;
};

export const getSavedPlans = (): PlanTier[] => {
  try {
    const saved = localStorage.getItem('spartan_plans_config');
    if (saved) {
      const parsed: PlanTier[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return ensureFounderPlan(parsed);
      }
    }
  } catch {}
  return DEFAULT_PLANS;
};

/**
 * Retorna apenas os planos públicos disponíveis para registro ou auto-upgrade de clientes comuns.
 * O plano SPARTAN FUNDADOR é estritamente restrito e liberado apenas pelo administrador.
 */
export const getPublicPlans = (): PlanTier[] => {
  return getSavedPlans().filter(
    (p) => !p.adminOnly && p.id !== 'fundador' && !p.name.toUpperCase().includes('FUNDADOR')
  );
};

export const savePlansConfig = (plans: PlanTier[]): void => {
  try {
    const safeList = ensureFounderPlan(plans);
    localStorage.setItem('spartan_plans_config', JSON.stringify(safeList));
  } catch {}
};
