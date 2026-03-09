import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useIntegrationAgent } from '../../../lib/agents/IntegrationAgent';
import ConnectMetaButton from '../../ConnectMetaButton';
import { Card, CardHeader, CardContent } from '../../ui/Card';

export default function IntegrationModule() {
    const { user } = useAuth();
    const { data: connection, isLoading } = useIntegrationAgent();

    return (
        <div className="space-y-6">
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
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Meta Ads</h3>
                            <p className="text-sm text-gray-500">Connect to Facebook & Instagram</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="h-10 bg-gray-100 animate-pulse rounded-lg"></div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${connection?.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {connection?.isConnected ? 'Meta Connected' : 'Not Connected'}
                                        </p>
                                        {connection?.isConnected && connection.adAccountName && (
                                            <p className="text-xs text-gray-500 mt-0.5">{connection.adAccountName}</p>
                                        )}
                                    </div>
                                </div>
                                <ConnectMetaButton
                                    userId={user?.id}
                                    isConnected={!!connection?.isConnected}
                                    variant="button"
                                />
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
        </div>
    );
}
