import { Home, BarChart3, Zap } from 'lucide-react';

interface SidebarNavigationProps {
  activeTab: 'home' | 'analytics' | 'ads';
  onTabChange: (tab: 'home' | 'analytics' | 'ads') => void;
  metaConnected: boolean;
}

export default function SidebarNavigation({
  activeTab,
  onTabChange,
  metaConnected,
}: SidebarNavigationProps) {
  const tabs = [
    {
      id: 'home' as const,
      icon: Home,
      label: 'Home',
      title: 'Dashboard Overview',
    },
    {
      id: 'analytics' as const,
      icon: BarChart3,
      label: 'Analytics',
      title: 'Performance Analytics',
    },
    {
      id: 'ads' as const,
      icon: Zap,
      label: 'Ads',
      title: 'Ad Management',
      disabled: !metaConnected,
    },
  ];

  return (
    <div className="w-full border-b border-gray-700 bg-gray-900">
      <div className="flex items-center justify-start gap-2 overflow-x-auto px-6 py-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`group relative flex flex-col items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : isDisabled
                    ? 'cursor-not-allowed text-gray-600'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
              title={isDisabled ? `${tab.title} - Meta not connected` : tab.title}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{tab.label}</span>

              {isDisabled && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                  Meta not connected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
