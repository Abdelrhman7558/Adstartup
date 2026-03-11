import { useState, useEffect } from 'react';
import { ClientSidebar } from '../components/client-dashboard/ClientSidebar';
import { ClientHeader } from '../components/client-dashboard/ClientHeader';
import ClientNewCampaignModal from '../components/client-dashboard/ClientNewCampaignModal';
import { useQueryClient } from '@tanstack/react-query';

export function ClientDashboardLayout({ children }: { children?: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOpenModal = () => setIsCampaignModalOpen(true);
        window.addEventListener('openNewCampaignModal', handleOpenModal);
        return () => window.removeEventListener('openNewCampaignModal', handleOpenModal);
    }, []);

    const handleCampaignCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard_data_master'] });
        queryClient.invalidateQueries({ queryKey: ['agent_campaigns'] });
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-gray-900">
            {/* Sidebar */}
            <ClientSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative">
                <ClientHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">

                        {/* Dynamic Tab Content injected here via React Router */}
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Global Campaign Creation Modal */}
            <ClientNewCampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                onSuccess={handleCampaignCreated}
            />
        </div>
    );
}
