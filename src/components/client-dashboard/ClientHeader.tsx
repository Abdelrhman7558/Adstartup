import { Search, Bell, Share2, Menu } from 'lucide-react';
import { toast } from '../ui/Toast';
import { useState, useEffect, useRef } from 'react';
import OptimizationLogs, { OptimizationLog } from './OptimizationLogs';

interface ClientHeaderProps {
    onMenuClick: () => void;
}

export function ClientHeader({ onMenuClick }: ClientHeaderProps) {
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast('Link copied to clipboard!', 'success');
        } catch {
            toast('Failed to copy link', 'error');
        }
    };

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [logs, setLogs] = useState<OptimizationLog[]>([
        {
            id: '1',
            action: 'AI Optimization Engine Started',
            details: 'Ready to manage daily budgets and scale successful campaigns.',
            timestamp: new Date(),
            type: 'general'
        }
    ]);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
         const handleLog = (e: CustomEvent) => {
              setLogs(prev => [e.detail, ...prev]);
         };
         window.addEventListener('addOptimizationLog', handleLog as EventListener);
         return () => window.removeEventListener('addOptimizationLog', handleLog as EventListener);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-20 w-full bg-[#F8F9FA]/80 backdrop-blur-md border-b border-gray-100 h-[72px] flex items-center">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full max-w-[1400px] mx-auto">
                {/* Left Side (Menu Toggle for Mobile + Breadcrumb/Title eventually) */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 lg:hidden text-gray-500 hover:bg-gray-100 items-center justify-center rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden sm:block">
                        {/* Contextual Title mapping to active route could go here, or handled within the module */}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Search Input */}
                    <div className="relative hidden sm:flex items-center">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-9 pr-12 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all w-64"
                        />
                        <div className="absolute right-3 flex gap-1">
                            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
                                ⌘
                            </kbd>
                            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
                                F
                            </kbd>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    {/* Share Button */}
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <span>Share</span>
                        <Share2 className="w-4 h-4 text-gray-500" />
                    </button>

                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {logs.length > 1 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-[360px] h-[450px] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col z-50 overflow-hidden transform origin-top-right transition-all">
                                <OptimizationLogs logs={logs} isDropdown={true} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
