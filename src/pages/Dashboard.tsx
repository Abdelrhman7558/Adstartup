import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  BarChart3,
  Upload,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { fetchDashboardData, DashboardMetrics } from '../lib/aiDataService';

import UploadAssets from '../components/UploadAssets';
import NotificationsPanel from '../components/NotificationsPanel';

type DashboardView = 'home' | 'ads' | 'assets';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [currentView, setCurrentView] = useState<DashboardView>('home');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [metaConnected, setMetaConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Auth + Meta Check */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!user && !loading) {
      navigate('/signin');
      return;
    }

    const checkMeta = async () => {
      try {
        const { data } = await supabase
          .from('meta_connections')
          .select('is_connected')
          .eq('user_id', user?.id)
          .maybeSingle();

        const connected = !!data?.is_connected;
        setMetaConnected(connected);

        if (connected) {
          await loadMetrics();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    };

    if (user) checkMeta();
  }, [user, loading, navigate]);

  const loadMetrics = async () => {
    if (!user?.id) return;
    try {
      setMetricsLoading(true);
      const data = await fetchDashboardData(user.id);
      setMetrics(data);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleConnectMeta = () => {
    if (!user?.id) return;

    const clientId = '891623109984411';

    // Use Supabase Edge Function instead of n8n
    const redirectUri = 'https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/meta-oauth-callback';
    const scope = 'ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,catalog_management';

    // Create a base64 encoded state for security and dynamic redirect
    const stateContent = `${user.id}:${Date.now()}:${window.location.origin}`;
    const state = btoa(stateContent);

    window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-[#B11226]/40 border-t-[#B11226] rounded-full animate-spin" />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------------------------ */

  const menu = [
    { id: 'home', icon: Home },
    { id: 'ads', icon: BarChart3 },
    { id: 'assets', icon: Upload },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#1A1A1A]">
      {/* Sidebar */}
      <aside className="w-20 bg-white border-r flex flex-col justify-between">
        <nav className="flex flex-col items-center gap-6 py-8">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as DashboardView)}
                className="relative"
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#B11226] rounded-full" />
                )}
                <Icon
                  className={`w-6 h-6 ${active ? 'text-[#B11226]' : 'text-[#1A1A1A]'
                    }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-4 pb-6">
          <button onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>

          <div className="flex items-center gap-4">
            <button
              className="relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#B11226] rounded-full animate-pulse" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </header>

        {/* Meta Status */}
        {!metaConnected ? (
          <button
            onClick={handleConnectMeta}
            className="px-6 py-3 bg-[#B11226] text-white rounded-xl font-medium shadow"
          >
            Connect Meta Account
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B11226]/10 text-[#B11226] rounded-xl">
            <span className="w-2 h-2 bg-[#B11226] rounded-full" />
            Active Meta Account
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Spend"
            value={`$${metrics?.totalSpend ?? 0}`}
          />
          <MetricCard
            title="Revenue"
            value={`$${metrics?.totalRevenue ?? 0}`}
          />
          <MetricCard
            title="ROI"
            value={`${metrics?.totalROI?.toFixed(1) ?? 0}%`}
          />
          <MetricCard
            title="Active Campaigns"
            value={`${metrics?.activeCampaigns ?? 0}`}
          />
        </div>

        {/* Views */}
        {currentView === 'home' && <Section title="Overview" />}
        {currentView === 'ads' && <Section title="Ads Performance" />}
        {currentView === 'assets' && <UploadAssets />}
      </main>

      {/* Notifications */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{value}</p>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-500">Content goes here</p>
    </div>
  );
}













