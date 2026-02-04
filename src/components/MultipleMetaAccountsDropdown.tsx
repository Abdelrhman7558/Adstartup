import { useState, useEffect, useRef } from 'react';
import { User, X, Plus, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { isManagerPlanUser } from '../lib/managerPlanService';

interface MetaAccount {
    id: string;
    account_id: string;
    account_name: string;
    created_at: string;
}

export default function MultipleMetaAccountsDropdown() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [accounts, setAccounts] = useState<MetaAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Only show for Manager plan users
    if (!user || !isManagerPlanUser(user.email)) {
        return null;
    }

    useEffect(() => {
        loadAccounts();
    }, [user?.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadAccounts = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('manager_meta_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setAccounts(data || []);
        } catch (err) {
            console.error('Error loading Meta accounts:', err);
            setError('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (accountId: string) => {
        if (!user?.id) return;

        try {
            setDeletingId(accountId);
            setError(null);

            const { error: deleteError } = await supabase
                .from('manager_meta_accounts')
                .delete()
                .eq('id', accountId)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            // Remove from local state
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        } catch (err) {
            console.error('Error deleting Meta account:', err);
            setError('Failed to delete account');
        } finally {
            setDeletingId(null);
        }
    };

    const handleConnectNew = () => {
        if (!user?.id) return;

        const clientId = '891623109984411';
        const redirectUri = 'https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback';
        const scope = 'ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,ads_read,business_management,catalog_management';
        const state = `${user.id}__manager`; // Special state to indicate Manager multi-account

        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

        window.location.href = oauthUrl;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User icon button */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) loadAccounts();
                }}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                title="Manage Meta Accounts"
            >
                <User className="w-5 h-5" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className={`absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-lg z-50 ${theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                >
                    {/* Header */}
                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            Connected Meta Accounts
                        </h3>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Manager Plan - Multiple accounts enabled
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Accounts list */}
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                <p className="text-sm">No accounts connected yet</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className={`flex items-center justify-between px-4 py-3 ${theme === 'dark'
                                                ? 'hover:bg-gray-700/50'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {account.account_name}
                                            </p>
                                            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                ID: {account.account_id}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAccount(account.id)}
                                            disabled={deletingId === account.id}
                                            className="ml-2 p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Remove account"
                                        >
                                            {deletingId === account.id ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <X className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add new account button */}
                    <div className={`px-4 py-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <button
                            onClick={handleConnectNew}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Connect Another Account
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
