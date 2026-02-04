import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ChevronDown, Copy, Check, Settings, HelpCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isManagerPlanUser } from '../lib/managerPlanService';

interface TrialInfo {
  trial_end_at: string;
  trial_expired: boolean;
  remaining_days: number;
}

export default function UserMenu() {
  const { user, profile, isSubscribed, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const initials = firstName[0]?.toUpperCase() || 'U';
  const userId = user?.id || '';

  useEffect(() => {
    if (user?.id) {
      loadTrialData();
    }
  }, [user]);

  const loadTrialData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('trial_end_at, trial_expired')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.trial_end_at) {
        const endDate = new Date(data.trial_end_at);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setTrialInfo({
          trial_end_at: data.trial_end_at,
          trial_expired: data.trial_expired || diffDays <= 0,
          remaining_days: Math.max(0, diffDays)
        });
      }
    } catch (error) {
      console.error('Error loading trial data:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleDashboard = () => {
    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleAccountSettings = () => {
    setIsOpen(false);
    // Navigate to account settings page (to be implemented)
    console.log('Navigate to Account Settings');
  };

  const handleHelpCenter = () => {
    setIsOpen(false);
    // Navigate to help center or open external link
    console.log('Navigate to Help Center');
  };

  const copyUserId = async () => {
    if (userId) {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          {(() => {
            console.log('UserMenu Debug:', {
              email: user?.email,
              isManager: isManagerPlanUser(user?.email),
              trialInfo
            });
            return null;
          })()}
          <span className="text-sm">{firstName}</span>
          {trialInfo && !trialInfo.trial_expired && !isManagerPlanUser(user?.email) && (
            <span className="text-xs text-green-400">
              {trialInfo.remaining_days}d trial
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-white">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            {isManagerPlanUser(user?.email) ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-purple-400">
                  Plan: Manager
                </span>
              </div>
            ) : trialInfo && trialInfo.trial_expired ? (
              <div className="mt-3 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-400">Trial Expired</p>
                  <p className="text-xs text-red-300 mt-0.5">Your trial period has ended. Subscribe now.</p>
                </div>
              </div>
            ) : trialInfo && !trialInfo.trial_expired ? (
              <div className="mt-3 flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-400">Trial Active</p>
                  <p className="text-xs text-green-300 mt-0.5">
                    {trialInfo.remaining_days} day{trialInfo.remaining_days !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-500'}`}
                />
                <span
                  className={`text-xs font-medium ${isSubscribed ? 'text-green-400' : 'text-gray-500'}`}
                >
                  Plan: {isSubscribed ? 'Active' : 'Free'}
                </span>
              </div>
            )}
          </div>

          {/* User ID - Copyable */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-1">User ID</p>
            <button
              onClick={copyUserId}
              className="w-full flex items-center justify-between gap-2 text-xs text-gray-300 hover:text-white transition-colors group"
            >
              <span className="font-mono truncate">{userId}</span>
              {copied ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 group-hover:text-white flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleAccountSettings}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </button>

            {/* Dashboard Link - Show if subscribed OR Manager plan user */}
            {(isSubscribed || isManagerPlanUser(user?.email)) && (
              <button
                onClick={handleDashboard}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            <button
              onClick={handleHelpCenter}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help Center</span>
            </button>
          </div>

          <div className="border-t border-gray-800"></div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-3"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
