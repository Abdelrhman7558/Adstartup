import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Link as LinkIcon,
    Megaphone,
    BarChart3,
    CreditCard,
    Settings,
    Target,
    CalendarDays,
    Activity,
    Users
} from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function ClientSidebar({ isOpen }: SidebarProps) {
    const { profile, user } = useAuth();

    // Example hardcoded badge counts matching the image
    const badges = {
        campaigns: 32,
        billing: 2,
    };

    const navItems = [
        { name: 'Overview', path: '/dashboard/overview', icon: LayoutDashboard },
        { name: 'Integration', path: '/dashboard/integration', icon: LinkIcon },
        { name: 'Campaign', path: '/dashboard/campaigns', icon: Megaphone, badge: badges.campaigns },
    ];

    const analyticsItems = [
        { name: 'Overall', path: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Sent', path: '/dashboard/analytics/sent' },
        { name: 'Campaigns', path: '/dashboard/analytics/campaigns' },
    ];

    const bottomItems = [
        { name: 'Billing', path: '/dashboard/billing', icon: CreditCard, badge: badges.billing },
        { name: 'Business Settings', path: '/dashboard/settings', icon: Settings },
    ];

    const secondaryNavItems = [
        { name: 'Ads Settings', icon: Target },
        { name: 'Campaign Planner', icon: CalendarDays },
        { name: 'Event Manager', icon: Activity },
        { name: 'Viewers', icon: Users },
    ];

    return (
        <aside
            className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out",
                !isOpen && "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden",
                isOpen && "translate-x-0"
            )}
        >
            <div className="flex flex-col h-full w-64 px-4 py-6 overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center gap-2 px-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                            <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">Clickora</span>
                </div>

                {/* User Card */}
                <div className="flex items-center gap-3 p-3 mb-8 bg-gray-50/50 rounded-xl border border-gray-100/50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 grid place-items-center overflow-hidden">
                        <span className="text-sm font-bold text-blue-600">
                            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                            {profile?.full_name || 'Sista Silala'}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                            {user?.email || 'sistasilala@gmail.com'}
                        </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v.01M12 12v.01M12 19v.01" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Main Menu */}
                <div className="mb-2">
                    <span className="px-2 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                        Main Menu
                    </span>
                </div>

                <nav className="space-y-0.5 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50/80 text-blue-600 shadow-sm shadow-blue-100/50"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 opacity-80" />
                                {item.name}
                            </div>
                            {item.badge && (
                                <NotificationBadge count={item.badge} />
                            )}
                        </NavLink>
                    ))}

                    {/* Analytics Dropdown Simulation */}
                    <div className="mt-2">
                        <NavLink
                            to="/dashboard/analytics"
                            className={({ isActive }) => cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                    ? "bg-blue-50/80 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 opacity-80" />
                                Analytics
                            </div>
                            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                        </NavLink>
                        <div className="ml-[34px] mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                            {analyticsItems.slice(1).map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="my-4 border-t border-gray-100"></div>

                    {bottomItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50/80 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 opacity-80" />
                                {item.name}
                            </div>
                            {item.badge && (
                                <NotificationBadge count={item.badge} className="bg-red-500" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Secondary Nav */}
                <div className="mt-6">
                    <span className="px-2 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                        Pasang Iklan
                    </span>
                    <nav className="mt-2 space-y-0.5">
                        {secondaryNavItems.map((item) => (
                            <button
                                key={item.name}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                <item.icon className="w-5 h-5 opacity-80" />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* AI Analytics Bottom Card */}
                <div className="mt-8 bg-blue-600 rounded-2xl p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>

                    <div className="relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">AI Analytics</h4>
                        <p className="text-[11px] text-blue-100 font-medium leading-relaxed">
                            Unlock deeper data insights with AI Analytics (Beta)
                        </p>
                    </div>
                </div>

            </div>
        </aside>
    );
}
