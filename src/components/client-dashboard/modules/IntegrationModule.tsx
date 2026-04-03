import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useIntegrationAgent } from '../../../lib/agents/IntegrationAgent';
import ConnectMetaButton from '../../ConnectMetaButton';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import { isManagerPlanUser } from '../../../lib/managerPlanService';
import MetaAccountsManager from '../../dashboard/MetaAccountsManager';
import { Plus } from 'lucide-react';

export default function IntegrationModule() {
    const { user } = useAuth();
    const { data: connection, isLoading } = useIntegrationAgent();
    const isManager = isManagerPlanUser(user?.email);
    const [showManager, setShowManager] = useState(false);

    const handleDisconnect = () => {
        // Handled internally by ConnectMetaButton
    };

    return (
        <div className="space-y-8 w-full">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-500 mt-1">Manage your connected accounts and data sources.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="text-2xl font-bold text-blue-600">f</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">Meta Ads</h3>
                            <p className="text-sm text-gray-500">Connect to Facebook & Instagram</p>
                        </div>
                        {isManager && connection?.isConnected && (
                            <button
                                onClick={() => setShowManager(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add More
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <ConnectMetaButton
                                    userId={user?.id}
                                    isConnected={!!connection?.isConnected}
                                    variant="button"
                                    onDisconnect={handleDisconnect}
                                    className="w-full sm:w-auto"
                                />
                                {isManager && connection?.isConnected && (
                                    <p className="text-xs text-gray-400 text-center sm:text-right w-full sm:w-auto">
                                        You are on the Manager Plan. You can link multiple accounts.
                                    </p>
                                )}
                            </div>
                        )}
                        {!connection?.isConnected && (
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Connect your Meta Business account to import your ad campaigns, analytics, and automate your ad creation process directly from our dashboard.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Additional potential integrations can go here */}
                <Card className="opacity-50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-400">G</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-700">Google Ads</h3>
                            <p className="text-sm text-gray-500">Coming Soon</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                            Coming Soon
                        </button>
                    </CardContent>
                </Card>
            </div>

            <MetaAccountsManager isOpen={showManager} onClose={() => setShowManager(false)} />
        </div>
    );
}
