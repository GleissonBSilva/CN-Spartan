export interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  screens: number;
  quality: string;
  description: string;
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

export const getSavedPlans = (): PlanTier[] => {
  try {
    const saved = localStorage.getItem('spartan_plans_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PLANS;
};

export const savePlansConfig = (plans: PlanTier[]): void => {
  try {
    localStorage.setItem('spartan_plans_config', JSON.stringify(plans));
  } catch {}
};
