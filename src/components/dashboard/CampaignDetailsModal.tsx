
import { X, Calendar, DollarSign, MousePointer, Eye, BarChart2, TrendingUp, Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Campaign } from '../../lib/dataTransformer';

interface CampaignDetailsModalProps {
    campaign: Campaign;
    onClose: () => void;
}

export default function CampaignDetailsModal({ campaign, onClose }: CampaignDetailsModalProps) {
    const { theme } = useTheme();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div
                className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <div>
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {campaign.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${campaign.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                {campaign.status}
                            </span>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                ID: {campaign.id}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                        {/* Spend & Revenue */}
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-blue-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Spend</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ${campaign.spend.toLocaleString()}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Revenue</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                ${campaign.revenue.toLocaleString()}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-purple-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ROAS</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                                {campaign.roas}x
                            </p>
                        </div>

                        {/* Engagement */}
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-orange-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Impressions</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {campaign.impressions?.toLocaleString() || '-'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <MousePointer className="w-4 h-4 text-cyan-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Clicks</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {campaign.clicks?.toLocaleString() || '-'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart2 className="w-4 h-4 text-indigo-500" />
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CTR</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {campaign.ctr ? campaign.ctr.toFixed(2) + '%' : '-'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-400">CPC</span>
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Cost Per Click</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ${campaign.cpc?.toFixed(2) || '-'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-400">CPA</span>
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Cost Per Action</span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                ${campaign.cpa?.toFixed(2) || '-'}
                            </p>
                        </div>
                    </div>

                    <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Runtime</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Start Date</span>
                                <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                                    {campaign.date_start ? new Date(campaign.date_start).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>End Date</span>
                                <p className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                                    {campaign.date_stop ? new Date(campaign.date_stop).toLocaleDateString() : 'Ongoing'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
