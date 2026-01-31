import { useState, useEffect } from 'react';
import { Edit2, Save, X, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface MetaConnection {
  id: string;
  ad_account_id: string | null;
  ad_account_name: string | null;
  pixel_id: string | null;
  pixel_name: string | null;
  catalog_id: string | null;
  catalog_name: string | null;
  page_id: string | null;
  page_name: string | null;
}

interface AdAccount {
  ad_account_id: string;
  ad_account_name: string;
}

interface Pixel {
  pixel_id: string;
  pixel_name: string;
}

interface Catalog {
  catalog_id: string;
  catalog_name: string;
}

interface Page {
  page_id: string;
  page_name: string;
}

export default function AccountsSettings() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentConnection, setCurrentConnection] = useState<MetaConnection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [error, setError] = useState('');

  const [editAdAccountId, setEditAdAccountId] = useState('');
  const [editAdAccountName, setEditAdAccountName] = useState('');
  const [editPixelId, setEditPixelId] = useState('');
  const [editPixelName, setEditPixelName] = useState('');
  const [editCatalogId, setEditCatalogId] = useState('');
  const [editCatalogName, setEditCatalogName] = useState('');
  const [editPageId, setEditPageId] = useState('');
  const [editPageName, setEditPageName] = useState('');

  const [availableAdAccounts, setAvailableAdAccounts] = useState<AdAccount[]>([]);
  const [availablePixels, setAvailablePixels] = useState<Pixel[]>([]);
  const [availableCatalogs, setAvailableCatalogs] = useState<Catalog[]>([]);
  const [availablePages, setAvailablePages] = useState<Page[]>([]);

  useEffect(() => {
    if (user) {
      loadCurrentConnection();
    }
  }, [user]);

  const loadCurrentConnection = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('meta_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (err) throw err;
      setCurrentConnection(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load connection';
      console.error('Error loading connection:', message);
      setError(`Unable to load account settings: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaAccountsFromWebhook = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('https://n8n.srv1181726.hstgr.cloud/webhook-test/Accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook error: Status ${response.status}. ${errorText || 'No details provided'}`);
      }

      const data = await response.json();

      if (data.ad_accounts) setAvailableAdAccounts(data.ad_accounts);
      if (data.pixels) setAvailablePixels(data.pixels);
      if (data.catalogs) setAvailableCatalogs(data.catalogs);
      if (data.pages) setAvailablePages(data.pages);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch accounts from webhook';
      console.error('Webhook fetch error:', message);
      return false;
    }
  };

  const fetchMetaAccountsFromDatabase = async () => {
    if (!user) return;

    try {
      const { data: connections, error: err } = await supabase
        .from('meta_connections')
        .select('*')
        .eq('user_id', user.id);

      if (err) throw err;

      if (connections) {
        const adAccounts = connections
          .filter(c => c.ad_account_id && c.ad_account_name)
          .map(c => ({ ad_account_id: c.ad_account_id!, ad_account_name: c.ad_account_name! }));
        const uniqueAdAccounts = Array.from(
          new Map(adAccounts.map(item => [item.ad_account_id, item])).values()
        );
        setAvailableAdAccounts(uniqueAdAccounts);

        const pixels = connections
          .filter(c => c.pixel_id && c.pixel_name)
          .map(c => ({ pixel_id: c.pixel_id!, pixel_name: c.pixel_name! }));
        const uniquePixels = Array.from(
          new Map(pixels.map(item => [item.pixel_id, item])).values()
        );
        setAvailablePixels(uniquePixels);

        const catalogs = connections
          .filter(c => c.catalog_id && c.catalog_name)
          .map(c => ({ catalog_id: c.catalog_id!, catalog_name: c.catalog_name! }));
        const uniqueCatalogs = Array.from(
          new Map(catalogs.map(item => [item.catalog_id, item])).values()
        );
        setAvailableCatalogs(uniqueCatalogs);

        const pages = connections
          .filter(c => c.page_id && c.page_name)
          .map(c => ({ page_id: c.page_id!, page_name: c.page_name! }));
        const uniquePages = Array.from(
          new Map(pages.map(item => [item.page_id, item])).values()
        );
        setAvailablePages(uniquePages);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load accounts from database';
      console.error('Database fetch error:', message);
      throw err;
    }
  };

  const handleEdit = async () => {
    if (!user || !currentConnection) return;

    setEditAdAccountId(currentConnection.ad_account_id || '');
    setEditAdAccountName(currentConnection.ad_account_name || '');
    setEditPixelId(currentConnection.pixel_id || '');
    setEditPixelName(currentConnection.pixel_name || '');
    setEditCatalogId(currentConnection.catalog_id || '');
    setEditCatalogName(currentConnection.catalog_name || '');
    setEditPageId(currentConnection.page_id || '');
    setEditPageName(currentConnection.page_name || '');

    setIsEditing(true);
    setFetchingAccounts(true);
    setError('');

    const webhookSuccess = await fetchMetaAccountsFromWebhook();

    if (!webhookSuccess) {
      try {
        await fetchMetaAccountsFromDatabase();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load accounts';
        setError(`Could not fetch accounts from webhook or database: ${message}`);
      }
    }

    setFetchingAccounts(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditAdAccountId('');
    setEditAdAccountName('');
    setEditPixelId('');
    setEditPixelName('');
    setEditCatalogId('');
    setEditCatalogName('');
    setEditPageId('');
    setEditPageName('');
    setError('');
  };

  const handleSave = async () => {
    if (!user || !currentConnection) return;

    setSaving(true);
    setError('');

    try {
      const { error: err } = await supabase
        .from('meta_connections')
        .update({
          ad_account_id: editAdAccountId || null,
          ad_account_name: editAdAccountName || null,
          pixel_id: editPixelId || null,
          pixel_name: editPixelName || null,
          catalog_id: editCatalogId || null,
          catalog_name: editCatalogName || null,
          page_id: editPageId || null,
          page_name: editPageName || null,
        })
        .eq('id', currentConnection.id);

      if (err) throw err;

      await loadCurrentConnection();
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setError(`Error saving account settings: ${message}`);
      console.error('Save error:', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading settings...
        </div>
      </div>
    );
  }

  if (!currentConnection) {
    return (
      <div className={`p-8 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
        No Meta connection found. Please connect your Meta account first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Account Settings
        </h2>
        <button
          onClick={() => window.location.href = '/meta/select'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Page
            </label>
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentConnection.page_name || 'Not set'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>ID: {currentConnection.page_id || '--'}</p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Ad Account
            </label>
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentConnection.ad_account_name || 'Not set'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>ID: {currentConnection.ad_account_id || '--'}</p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Pixel
            </label>
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentConnection.pixel_name || 'Not set'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>ID: {currentConnection.pixel_id || '--'}</p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Catalog
            </label>
            <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentConnection.catalog_name || 'Not set'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>ID: {currentConnection.catalog_id || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
