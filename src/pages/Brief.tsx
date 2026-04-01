import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ClientBriefForm from '../components/ClientBriefForm';

export default function Brief() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleBriefComplete = (briefId: string) => {
    navigate('/dashboard');
  };

  return <ClientBriefForm onComplete={handleBriefComplete} />;
}