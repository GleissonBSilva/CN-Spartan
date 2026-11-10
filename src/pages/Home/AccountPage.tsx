import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import { AccountModal } from '../../components/AccountModal';
import SEO from './SEO';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <SEO title="Minha Conta - Cine Spartan" description="Gerencie seu plano, assinatura e dados da conta Cine Spartan" />
      <AccountModal
        isOpen={true}
        onClose={() => navigate(-1)}
      />
    </div>
  );
};

export default AccountPage;
