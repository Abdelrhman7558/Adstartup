import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, UploadCloud, Settings, LogOut, Menu, X, Moon, Sun, BarChart3, Folder, FileText, BarChart2, RefreshCw, Plus, Clock, FolderOpen, Zap } from 'lucide-react';
import HomeView from '../components/dashboard/ProductionHomeView';
import AssetsView from '../components/dashboard/ProductionAssetsView';
import InsightsView from '../components/dashboard/InsightsView';
import CampaignsListView from '../components/dashboard/CampaignsListView';
import ActiveAdsView from '../components/dashboard/ActiveAdsView';
import SettingsModal from '../components/dashboard/SettingsModal';
import EditBriefModal from '../components/dashboard/EditBriefModal';
import NewCampaignModal from '../components/dashboard/NewCampaignModal';
import NotificationsDropdown from '../components/NotificationsDropdown';
import CountrySelector from '../components/CountrySelector';
import SupportChatbot from '../components/SupportChatbot';
import MultipleMetaAccountsDropdown from '../components/MultipleMetaAccountsDropdown';
import { supabase } from '../lib/supabase';
import { fetchDashboardData, DashboardData } from '../lib/dashboardDataService';
import { isManagerPlanUser } from '../lib/managerPlanService';
type View = 'home' | 'assets' | 'insights' | 'campaigns' | 'active-ads';

export default function ProductionDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditBrief, setShowEditBrief] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number>(0);
  const [trialActive, setTrialActive] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      checkMetaConnection();
      loadDashboardData();
      checkTrialStatus();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('display_name, theme_preference')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || user.email?.split('@')[0] || 'User');
    }
  };

  const checkMetaConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('meta_connections')
      .select('is_connected')
      .eq('user_id', user.id)
      .maybeSingle();

    setIsMetaConnected(data?.is_connected || false);
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      const data = await fetchDashboardData(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardError('Failed to load dashboard data. Please try again.');
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const checkTrialStatus = async () => {
    if (!user) return;

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
        const expired = data.trial_expired || diffDays <= 0;

        setTrialExpired(expired);
        setTrialActive(!expired && diffDays > 0);
        setRemainingDays(Math.max(0, diffDays));
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  const handleRefreshData = async () => {
    await loadDashboardData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const menuItems = [
    { id: 'home' as View, label: 'Home', icon: Home },
    { id: 'campaigns' as View, label: 'Campaigns', icon: FolderOpen },
    { id: 'active-ads' as View, label: 'Active Campaigns', icon: Zap },
    { id: 'assets' as View, label: 'Assets', icon: UploadCloud },
    { id: 'insights' as View, label: 'Insights', icon: BarChart2 },
  ];

  const handleConnectMeta = () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const clientId = '891623109984411';
    const redirectUri = 'https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback';
    const scope = 'ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,ads_read,business_management,catalog_management';
    const state = user.id;

    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    console.log('Redirecting to Meta OAuth:', oauthUrl);
    window.location.href = oauthUrl;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-r transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Dashboard
              </h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`lg:hidden p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome, {displayName}
              </p>
            </div>
          </div>

          {/* Edit Brief Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => setShowEditBrief(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-semibold"
            >
              <FileText className="w-5 h-5" />
              <span>Edit Your Brief</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
            <button
              onClick={() => setShowSettings(true)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${theme === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
      >
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-b`}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>

              <div className="flex items-center gap-3">
                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {displayName}
                </div>
                {trialActive && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                      Trial: {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!trialExpired && (
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              )}

              <button
                onClick={handleRefreshData}
                disabled={isLoadingDashboard}
                className={`p-2 rounded-lg transition-colors ${isLoadingDashboard
                  ? 'cursor-not-allowed opacity-50'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                title="Refresh dashboard data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
              </button>

              {/* For Manager users: Always show Connect Meta button */}
              {isManagerPlanUser(user?.email) && (
                <button
                  onClick={handleConnectMeta}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Connect Meta
                </button>
              )}

              {/* For non-Manager users: Only show when not connected */}
              {!isManagerPlanUser(user?.email) && !isMetaConnected && !trialExpired && (
                <button
                  onClick={handleConnectMeta}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Connect Meta
                </button>
              )}

              {!isManagerPlanUser(user?.email) && !isMetaConnected && trialExpired && (
                <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Trial Expired</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Subscribe to connect Meta</p>
                </div>
              )}

              {/* For non-Manager users: Show connected badge */}
              {!isManagerPlanUser(user?.email) && isMetaConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Meta Connected
                  </span>
                </div>
              )}

              {/* Manager Plan: Multiple accounts dropdown */}
              <MultipleMetaAccountsDropdown />

              <NotificationsDropdown />
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="p-6">
          {dashboardError && (
            <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark'
              ? 'bg-red-900/20 border-red-700 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
              }`}>
              <p className="font-medium">{dashboardError}</p>
              <button
                onClick={handleRefreshData}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {currentView === 'home' && (
            <HomeView
              isMetaConnected={isMetaConnected}
              data={dashboardData}
              isLoading={isLoadingDashboard}
              onDataRefresh={loadDashboardData}
            />
          )}
          {currentView === 'campaigns' && <CampaignsListView />}
          {currentView === 'active-ads' && <ActiveAdsView />}
          {currentView === 'assets' && <AssetsView />}
          {currentView === 'insights' && (
            <InsightsView data={dashboardData} isLoading={isLoadingDashboard} />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onUpdate={(newDisplayName) => {
            setDisplayName(newDisplayName);
            loadUserData();
          }}
        />
      )}

      {/* Edit Brief Modal */}
      {showEditBrief && (
        <EditBriefModal
          isOpen={showEditBrief}
          onClose={() => setShowEditBrief(false)}
          onSuccess={() => {
            setShowEditBrief(false);
          }}
        />
      )}

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <NewCampaignModal
          isOpen={showNewCampaignModal}
          onClose={() => setShowNewCampaignModal(false)}
          onSuccess={loadDashboardData}
        />
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <SupportChatbot />
    </div>
  );
}
