import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientDashboardLayout } from '../layouts/ClientDashboardLayout';

// Lazy loading modules for performance
const OverviewModule = React.lazy(() => import('../components/client-dashboard/modules/OverviewModule'));
const AnalyticsModule = React.lazy(() => import('../components/client-dashboard/modules/AnalyticsModule'));
const CampaignModule = React.lazy(() => import('../components/client-dashboard/modules/CampaignModule'));

// Fallbacks for loading states
const PageLoader = () => (
    <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

export default function ClientDashboard() {
    return (
        <ClientDashboardLayout>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<OverviewModule />} />
                    <Route path="analytics" element={<AnalyticsModule />} />
                    <Route path="campaigns" element={<CampaignModule />} />
                    <Route path="integration" element={<div className="p-4 bg-white rounded-xl">Integration Module Placeholder</div>} />
                    <Route path="billing" element={<div className="p-4 bg-white rounded-xl">Billing Module Placeholder</div>} />
                    <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
            </Suspense>
        </ClientDashboardLayout>
    );
}
