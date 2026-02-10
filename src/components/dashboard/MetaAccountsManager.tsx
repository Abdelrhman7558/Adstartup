import { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle,
    AlertCircle,
    Loader2,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext'; // Fixed import path
import { useTheme } from '../../contexts/ThemeContext'; // Fixed import path
import { supabase } from '../../lib/supabase'; // Fixed import path
import { validateUserId, logWebhookCall } from '../../lib/webhookUtils'; // Fixed import path

interface MetaAccount {
    id: string; // database id
    account_id: string; // meta account id
    account_name: string;
    created_at?: string;
}

interface AvailableAccount {
    id: string;
    name: string;
    currency?: string;
    account_status?: number;
}

interface MetaAccountsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MetaAccountsManager({ isOpen, onClose }: MetaAccountsManagerProps) {
    const { user } = useAuth();
    const { theme } = useTheme();

    // State for connected accounts (from DB)
    const [connectedAccounts, setConnectedAccounts] = useState<MetaAccount[]>([]);
    const [loadingConnected, setLoadingConnected] = useState(true);

    // State for available accounts (from Meta/n8n)
    const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [showAvailable, setShowAvailable] = useState(false);

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadConnectedAccounts();
        }
    }, [isOpen, user]);

    const loadConnectedAccounts = async () => {
        if (!user) return;
        try {
            setLoadingConnected(true);
            const { data, error } = await supabase
                .from('manager_meta_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setConnectedAccounts(data || []);
        } catch (err: any) {
            console.error('Error loading connected accounts:', err);
            setError('Failed to load connected accounts');
        } finally {
            setLoadingConnected(false);
        }
    };

    const fetchAvailableAccounts = async () => {
        if (!user) return;
        try {
            setLoadingAvailable(true);
            setError(null);
            setShowAvailable(true);

            const validatedUserId = validateUserId(user.id);

            // Call n8n webhook to get fresh list from Meta
            const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook/meta-ad-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: validatedUserId }),
            });

            if (!response.ok) throw new Error('Failed to fetch accounts from Meta');

            const result = await response.json();
            const data = Array.isArray(result) ? result[0] : result;

            const accounts = Array.isArray(data.ad_accounts) ? data.ad_accounts : [];
            setAvailableAccounts(accounts);

            logWebhookCall('POST', 'meta-ad-accounts', validatedUserId, true);
        } catch (err: any) {
            console.error('Error fetching available accounts:', err);
            setError('Failed to fetch accounts from Meta. Please check your connection.');
            logWebhookCall('POST', 'meta-ad-accounts', user?.id || 'unknown', false, { error: String(err) });
        } finally {
            setLoadingAvailable(false);
        }
    };

    const handleConnectAccount = async (account: AvailableAccount) => {
        if (!user) return;

        // Check if already connected
        if (connectedAccounts.some(a => a.account_id === account.id)) {
            setError(`Account ${account.name} is already connected`);
            return;
        }

        try {
            setProcessingId(account.id);
            setError(null);

            const { data, error } = await supabase
                .from('manager_meta_accounts')
                .insert({
                    user_id: user.id,
                    account_id: account.id,
                    account_name: account.name
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setConnectedAccounts(prev => [data, ...prev]);

            // Remove from available list view or just show as connected?
            // For now, we keep it but the UI will show it's connected

        } catch (err: any) {
            console.error('Error connecting account:', err);
            setError('Failed to connect account');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDisconnectAccount = async (id: string, accountName: string) => {
        if (!confirm(`Are you sure you want to disconnect ${accountName}?`)) return;

        try {
            setProcessingId(id); // Use DB ID here

            const { error } = await supabase
                .from('manager_meta_accounts')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setConnectedAccounts(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            console.error('Error disconnecting account:', err);
            setError('Failed to disconnect account');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredConnected = connectedAccounts.filter(acc =>
        acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.account_id.includes(searchTerm)
    );

    const filteredAvailable = availableAccounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.id.includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
            >
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <div>
                        <h2 className={`text-2xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            <ShieldCheck className="w-8 h-8 text-blue-500" />
                            Meta Accounts Manager
                        </h2>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Manage your connected ad accounts for campaign creation
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-6 pb-2 grid gap-4 md:grid-cols-2">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                                : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                }`}
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={fetchAvailableAccounts}
                            disabled={loadingAvailable}
                            className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${theme === 'dark'
                                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                        >
                            {loadingAvailable ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            Fetch from Meta
                        </button>
                        <button
                            onClick={() => {
                                // Redirect to standard OAuth
                                const clientId = '891623109984411';
                                const redirectUri = 'https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback';
                                // Add manager suffix to state
                                const state = `${user?.id}__manager`;
                                const scope = 'ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,ads_read,business_management,catalog_management';
                                window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
                            }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Connection
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-500">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Available Accounts Section (fetched from Meta) */}
                    {showAvailable && (
                        <div className="mb-8">
                            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                Available to Connect
                                <span className={`px-2 py-0.5 rounded-full text-xs ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    {filteredAvailable.length}
                                </span>
                            </h3>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredAvailable.map(account => {
                                    const isConnected = connectedAccounts.some(ca => ca.account_id === account.id);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={account.id}
                                            className={`p-4 rounded-xl border transition-all ${theme === 'dark'
                                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                } ${isConnected ? 'opacity-50' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <ExternalLink className="w-5 h-5" />
                                                </div>
                                                {isConnected ? (
                                                    <span className="text-green-500 flex items-center gap-1 text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" /> Connected
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConnectAccount(account)}
                                                        disabled={!!processingId}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'dark'
                                                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            }`}
                                                    >
                                                        {processingId === account.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : 'Connect'}
                                                    </button>
                                                )}
                                            </div>
                                            <h4 className={`font-semibold truncate mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {account.name}
                                            </h4>
                                            <div className={`text-xs flex flex-col gap-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                <span>ID: {account.id}</span>
                                                {account.currency && <span>{account.currency}</span>}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Connected Accounts Section */}
                    <div>
                        <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            Active Accounts
                            <span className="text-blue-500 px-2 py-0.5 rounded-full bg-blue-500/10 text-xs">
                                {filteredConnected.length}
                            </span>
                        </h3>

                        {loadingConnected ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : filteredConnected.length === 0 ? (
                            <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
                                }`}>
                                <p>No active accounts found.</p>
                                <p className="text-sm mt-2">Fetch from Meta or add a new connection.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead className={theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}>
                                        <tr>
                                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Account Name</th>
                                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Account ID</th>
                                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                        {filteredConnected.map((account) => (
                                            <tr
                                                key={account.id}
                                                className={`group transition-colors ${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <td className="p-4">
                                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                        {account.account_name}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`font-mono text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {account.account_id}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDisconnectAccount(account.id, account.account_name)}
                                                        disabled={!!processingId}
                                                        className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${theme === 'dark'
                                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            }`}
                                                        title="Disconnect Account"
                                                    >
                                                        {processingId === account.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
