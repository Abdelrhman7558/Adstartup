import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BarChart3, Upload, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import DashboardHomeView from '../components/dashboard/DashboardHomeView';
import DashboardAdsView from '../components/dashboard/DashboardAdsView';
import DashboardAssetsView from '../components/dashboard/DashboardAssetsView';

type DashboardView = 'home' | 'ads' | 'assets';

export default function NewDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<DashboardView>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    checkUserSetup();
  }, [user, navigate]);

  const checkUserSetup = async () => {
    if (!user) return;

    try {
      const { data: briefData } = await supabase
        .from('client_briefs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: selectionData } = await supabase
        .from('meta_account_selections')
        .select('selection_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!briefData) {
        navigate('/brief');
        return;
      } else if (briefData && !selectionData?.selection_completed) {
        navigate(`/meta-select?briefId=${briefData.id}`);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking user setup:', err);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const menuItems = [
    { id: 'home' as DashboardView, icon: Home, label: 'Home' },
    { id: 'ads' as DashboardView, icon: BarChart3, label: 'Ads' },
    { id: 'assets' as DashboardView, icon: Upload, label: 'Upload Assets' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="w-20 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex-1 py-8">
          <nav className="space-y-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex flex-col items-center gap-2 px-4 py-3 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="py-6 space-y-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="w-full flex flex-col items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-6 h-6" />
                <span className="text-xs">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-6 h-6" />
                <span className="text-xs">Light</span>
              </>
            )}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex flex-col items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {currentView === 'home' && <DashboardHomeView />}
        {currentView === 'ads' && <DashboardAdsView />}
        {currentView === 'assets' && <DashboardAssetsView />}
      </main>
    </div>
  );
}