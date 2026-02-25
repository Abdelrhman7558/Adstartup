import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateUserId, logWebhookCall, WebhookValidationError } from '../lib/webhookUtils';
import { supabase } from '../lib/supabase';

interface AdAccount {
  id: string;
  name: string;
  currency?: string;
  account_status?: number;
}

interface Pixel {
  id: string;
  name: string;
  ad_account_id?: string;
  last_fired_time?: string;
}

interface Catalog {
  id: string;
  name: string;
  product_count?: number;
}

interface Page {
  id: string;
  name: string;
  picture?: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  type: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function MetaSelect() {
  // DEBUG: Log immediately on component render
  console.log('[MetaSelect] Component rendering at:', window.location.href);

  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [searchParams] = useSearchParams();

  // DEBUG: Log all search params
  console.log('[MetaSelect] Search params:', Object.fromEntries(searchParams.entries()));
  const rawUserId = searchParams.get('user_id') || user?.id;
  // Robust: Split by ANY underscore to ensure we get clean UUID (UUIDs use hyphens, not underscores)
  const userId = rawUserId?.includes('_') ? rawUserId.split('_')[0] : rawUserId;



  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [pages, setPages] = useState<Page[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);

  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [selectedInstagramId, setSelectedInstagramId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Debug: Log the effective ID
  useEffect(() => {
    console.log('[MetaSelect] Initialized with Raw:', rawUserId, 'Clean:', userId);
  }, [rawUserId, userId]);

  // SAFETY TIMEOUT: Force stop loading after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading timed out. Please try refreshing.');
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    // Validate ID asynchronously to avoid white-page render blocking
    if (!userId && !loading) {
      // Only redirect if we are sure we are done loading and truly have no ID
      // navigate('/signin'); 
      // For now, show error instead of redirecting to debug loop
      setError('No User ID found. Please Sign In.');
    }
  }, [userId, loading, navigate]);

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  // RENDER DEBUG OVERLAY - Only show in development mode
  const DebugOverlay = () => {
    // Hide debug overlay in production
    if (!import.meta.env.DEV) return null;

    return (
      <div className="fixed bottom-4 right-4 p-4 bg-black bg-opacity-90 border border-gray-700 rounded-lg text-xs font-mono text-green-400 z-50 max-w-sm overflow-hidden pointer-events-none opacity-50 hover:opacity-100">
        <p>Raw ID: {rawUserId || 'null'}</p>
        <p>Clean ID: {userId || 'null'}</p>
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <p>Error: {error || 'null'}</p>
        <p>Pages: {pages?.length || 0}</p>
        <p>Accounts: {adAccounts?.length || 0}</p>
      </div>
    );
  };

  const fetchAllData = async (attempt = 0) => {
    setLoading(true);
    setError(null);
    let isRetrying = false;
    try {
      // Fetch all assets and get their "found" status
      const [pagesFound, accountsFound, pixelsFound, catalogsFound] = await Promise.all([
        fetchPages(),
        fetchAdAccounts(),
        fetchPixels(),
        fetchCatalogs(),
      ]);

      // Check if ALL are empty (false returned)
      // Note: We use the local variables, not state, to avoid closure staleness
      const anyFound = pagesFound || accountsFound || pixelsFound || catalogsFound;

      if (!anyFound && attempt < 3) {
        isRetrying = true;
        console.log(`⚠️ All assets empty on attempt ${attempt + 1}. Starting countdown for retry...`);
        let secondsLeft = 5;
        setCountdown(secondsLeft);

        const timer = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            clearInterval(timer);
            setCountdown(0);
            fetchAllData(attempt + 1);
          } else {
            setCountdown(secondsLeft);
          }
        }, 1000);
        return;
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load Meta data. Please try again.');
    } finally {
      if (!isRetrying) {
        setLoading(false);
      }
    }
  };

  const fetchPages = async (): Promise<boolean> => {
    try {
      const validatedUserId = validateUserId(userId || undefined);

      const { data, error } = await supabase.functions.invoke('get-pages');

      if (error) throw new Error(error.message || 'Failed to fetch pages');

      const pagesArray = Array.isArray(data?.data) ? data.data.map((p: any) => ({
        id: p.page_id || p.id,
        name: p.page_name || p.name,
      })) : [];

      setPages(pagesArray);
      logWebhookCall('POST', 'get-pages', validatedUserId, true);
      return pagesArray.length > 0;
    } catch (err) {
      console.error('Error fetching pages:', err);
      logWebhookCall('POST', 'get-pages', userId || 'MISSING', false, { error: String(err) });
      return false;
    }
  };

  const fetchAdAccounts = async (): Promise<boolean> => {
    try {
      const validatedUserId = validateUserId(userId || undefined);

      const { data, error } = await supabase.functions.invoke('get-ad-accounts');

      if (error) throw new Error(error.message || 'Failed to fetch ad accounts');

      const accountsArray = Array.isArray(data?.data) ? data.data : [];

      setAdAccounts(accountsArray);
      logWebhookCall('POST', 'get-ad-accounts', validatedUserId, true);
      return accountsArray.length > 0;
    } catch (err) {
      console.error('Error fetching ad accounts:', err);
      logWebhookCall('POST', 'get-ad-accounts', userId || 'MISSING', false, { error: String(err) });
      return false;
    }
  };

  const fetchPixels = async (): Promise<boolean> => {
    try {
      const validatedUserId = validateUserId(userId || undefined);

      const { data, error } = await supabase.functions.invoke('get-pixels', {
        body: { ad_account_id: selectedAdAccount || '' },
      });

      if (error) throw new Error(error.message || 'Failed to fetch pixels');

      const pixelsArray = Array.isArray(data?.data) ? data.data : [];

      setPixels(pixelsArray);
      logWebhookCall('POST', 'get-pixels', validatedUserId, true);
      return pixelsArray.length > 0;
    } catch (err) {
      console.error('Error fetching pixels:', err);
      logWebhookCall('POST', 'get-pixels', userId || 'MISSING', false, { error: String(err) });
      return false;
    }
  };

  const fetchCatalogs = async (): Promise<boolean> => {
    try {
      const validatedUserId = validateUserId(userId || undefined);

      const { data, error } = await supabase.functions.invoke('get-catalogs');

      if (error) throw new Error(error.message || 'Failed to fetch catalogs');

      const catalogsArray = Array.isArray(data?.data) ? data.data : [];

      setCatalogs(catalogsArray);
      logWebhookCall('POST', 'get-catalogs', validatedUserId, true);
      return catalogsArray.length > 0;
    } catch (err) {
      console.error('Error fetching catalogs:', err);
      logWebhookCall('POST', 'get-catalogs', userId || 'MISSING', false, { error: String(err) });
      return false;
    }
  };

  const fetchInstagramAccounts = async (pageId: string): Promise<boolean> => {
    try {
      const validatedUserId = validateUserId(userId || undefined);

      const { data, error } = await supabase.functions.invoke('get-instagram-accounts', {
        body: { page_id: pageId },
      });

      if (error) throw new Error(error.message || 'Failed to fetch Instagram accounts');

      const accountsArray = Array.isArray(data?.data) ? data.data : [];

      setInstagramAccounts(accountsArray);
      logWebhookCall('POST', 'get-instagram-accounts', validatedUserId, true);
      return accountsArray.length > 0;
    } catch (err) {
      console.error('Error fetching Instagram accounts:', err);
      logWebhookCall('POST', 'get-instagram-accounts', userId || 'MISSING', false, { error: String(err) });
      return false;
    }
  };

  const handleNext = async () => {
    setError(null);

    if (currentStep === 1 && !selectedPage) {
      setError('Please select a Page');
      return;
    }

    if (currentStep === 1 && selectedPage) {
      // Fetch Instagram accounts for the newly selected page
      setLoading(true);
      await fetchInstagramAccounts(selectedPage);
      setLoading(false);
    }

    if (currentStep === 2 && !selectedAdAccount) {
      setError('Please select an Ad Account');
      return;
    }

    if (currentStep === 3 && !selectedPixel) {
      setError('Please select a Pixel');
      return;
    }

    if (currentStep === 4 && !selectedInstagramId) {
      setError('Please select an Instagram account (or skip if none available and not advertising on Instagram)');
      // we allow next if they explicitly clear it, but maybe let's make it optional if array is empty
      if (instagramAccounts.length > 0 && !selectedInstagramId) {
        setError('Please select an Instagram account');
        return;
      }
      setError(null);
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPage || !selectedAdAccount || !selectedPixel) {
      setError('Please select a Page, Ad Account, and Pixel');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const validatedUserId = validateUserId(userId || undefined);

      const selectedPageData = pages.find(p => p.id === selectedPage);
      const selectedAdAccountData = adAccounts.find(acc => acc.id === selectedAdAccount);
      const selectedPixelData = pixels.find(pix => pix.id === selectedPixel);
      const selectedCatalogData = catalogs.find(cat => cat.id === selectedCatalog);
      const selectedInstagramData = instagramAccounts.find(ig => ig.id === selectedInstagramId);

      const payload = {
        user_id: validatedUserId,
        brief_id: searchParams.get('briefId') || null,
        page_id: selectedPage,
        page_name: selectedPageData?.name || '',
        instagram_actor_id: selectedInstagramId || null,
        instagram_actor_name: selectedInstagramData?.username || null,
        ad_account_id: selectedAdAccount,
        ad_account_name: selectedAdAccountData?.name || '',
        pixel_id: selectedPixel,
        pixel_name: selectedPixelData?.name || '',
        catalog_id: selectedCatalog || null,
        catalog_name: selectedCatalogData?.name || null,
        is_manager_connection: searchParams.get('mode') === 'manager',
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/save-meta-selections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save selections');
      }

      const result = await response.json();
      if (result.success || result.data) {
        logWebhookCall('POST', 'meta-save-selection', validatedUserId, true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        throw new Error('Failed to save selections');
      }
    } catch (err: any) {
      if (err instanceof WebhookValidationError) {
        console.error('[handleSubmit] Validation error:', err.message);
      } else {
        console.error('Error submitting selections:', err);
      }
      logWebhookCall('POST', 'meta-save-selection', userId || 'MISSING', false, { error: err.message });
      setError(err.message || 'Failed to submit selections');
    } finally {
      setSubmitting(false);
    }
  };

  const SelectionList = ({ items, selected, onSelect, onClear, isLoading }: any) => (
    <div className="space-y-3">
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-between text-white"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{items.find((i: any) => i.id === selected)?.name}</p>
              <p className="text-xs text-green-100 mt-0.5">{selected}</p>
            </div>
          </div>
          <button
            onClick={() => onClear()}
            className="p-1.5 hover:bg-green-800 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      <div className={`space-y-2 max-h-96 overflow-y-auto ${selected ? 'opacity-50 pointer-events-none' : ''}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400">
              {countdown > 0
                ? `Loading... Retrying in ${countdown}s`
                : "Fetching Meta assets..."}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 bg-opacity-20 rounded-2xl border border-dashed border-gray-700">
            <p className="text-gray-400 mb-4">No items available yet</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold"
            >
              Retry Connection
            </button>
            <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest">Tip: Make sure your Meta account is connected</p>
          </div>
        ) : (
          (items || []).map((item: any) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: selected ? 1 : 1.02 }}
              onClick={() => onSelect(item.id)}
              disabled={selected !== null && selected !== item.id}
              className={`w-full p-4 border rounded-xl text-left transition-all group ${selected === item.id
                ? 'border-green-500 bg-green-900 bg-opacity-20'
                : 'border-gray-700 bg-gray-800 bg-opacity-40 hover:border-gray-600 hover:bg-gray-800 hover:bg-opacity-60'
                }`}
            >
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-xs text-gray-400 mt-1">{item.id}</p>
              {item.currency && <p className="text-xs text-gray-500 mt-1">Currency: {item.currency}</p>}
              {item.product_count && <p className="text-xs text-gray-500 mt-1">{item.product_count} products</p>}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-4">Setting Up Meta Business</h1>
          <p className="text-gray-400">Loading your Meta accounts and data...</p>
        </motion.div>
      </div>
    );
  }

  const stepTitles = {
    1: 'Select Meta Page',
    2: 'Select Ad Account',
    3: 'Choose Pixel',
    4: 'Instagram Account (Optional)',
    5: 'Pick Catalog',
    6: 'Review Selections',
  };

  const stepDescriptions = {
    1: 'Choose the Meta Page you want to work with',
    2: 'Choose the ad account you want to work with',
    3: 'Select a pixel to track conversions',
    4: 'Select an Instagram account connected to your page',
    5: 'Optionally select a product catalog',
    6: 'Review and confirm your choices',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <DebugOverlay />
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: step * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${currentStep >= step
                    ? 'bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-700 text-gray-400'
                    }`}
                >
                  {step}
                </motion.div>
                <p className={`text-xs mt-2 font-medium ${currentStep >= step ? 'text-blue-400' : 'text-gray-500'
                  }`}>
                  {step === 1 && 'Page'}
                  {step === 2 && 'Account'}
                  {step === 3 && 'Pixel'}
                  {step === 4 && 'Instagram'}
                  {step === 5 && 'Catalog'}
                  {step === 6 && 'Review'}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((step, index) => (
              <div
                key={step}
                className="flex-1"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: currentStep > step ? 1 : 0.2 }}
                  transition={{ duration: 0.6 }}
                  className={`h-1 rounded-full origin-left ${currentStep > step
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                    : 'bg-gray-700'
                    }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-600 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl mb-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{stepTitles[currentStep]}</h2>
            <p className="text-gray-400">{stepDescriptions[currentStep]}</p>
          </div>

          {/* Step 1: Pages */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SelectionList
                  items={pages}
                  selected={selectedPage}
                  onSelect={setSelectedPage}
                  onClear={() => setSelectedPage(null)}
                  isLoading={loading}
                />
              </motion.div>
            )}

            {/* Step 2: Ad Accounts */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SelectionList
                  items={adAccounts}
                  selected={selectedAdAccount}
                  onSelect={setSelectedAdAccount}
                  onClear={() => setSelectedAdAccount(null)}
                  isLoading={loading}
                />
              </motion.div>
            )}

            {/* Step 3: Pixels */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SelectionList
                  items={pixels}
                  selected={selectedPixel}
                  onSelect={setSelectedPixel}
                  onClear={() => setSelectedPixel(null)}
                  isLoading={loading}
                />
              </motion.div>
            )}

            {/* Step 4: Instagram Accounts */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SelectionList
                  items={instagramAccounts.map(ig => ({ ...ig, name: ig.username }))}
                  selected={selectedInstagramId}
                  onSelect={setSelectedInstagramId}
                  onClear={() => setSelectedInstagramId(null)}
                  isLoading={loading}
                />
                {instagramAccounts.length === 0 && !loading && (
                  <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl">
                    <p className="text-yellow-400 text-sm">No Instagram account found for this page. You can proceed, but ads may only run on Facebook.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Catalogs */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SelectionList
                  items={catalogs}
                  selected={selectedCatalog}
                  onSelect={setSelectedCatalog}
                  onClear={() => setSelectedCatalog(null)}
                  isLoading={loading}
                />
              </motion.div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ReviewItem
                  title="Page"
                  value={pages.find(p => p.id === selectedPage)?.name}
                  id={selectedPage}
                  icon="📄"
                />
                <ReviewItem
                  title="Instagram Account"
                  value={instagramAccounts.find(ig => ig.id === selectedInstagramId)?.username || 'Not selected'}
                  id={selectedInstagramId}
                  icon="📸"
                  optional
                />
                <ReviewItem
                  title="Ad Account"
                  value={adAccounts.find(a => a.id === selectedAdAccount)?.name}
                  id={selectedAdAccount}
                  icon="📊"
                />
                <ReviewItem
                  title="Pixel"
                  value={pixels.find(p => p.id === selectedPixel)?.name}
                  id={selectedPixel}
                  icon="📍"
                />
                <ReviewItem
                  title="Catalog"
                  value={catalogs.find(c => c.id === selectedCatalog)?.name || 'Not selected'}
                  id={selectedCatalog}
                  icon="📦"
                  optional
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep === 6 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm & Complete
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedPage) ||
                (currentStep === 2 && !selectedAdAccount) ||
                (currentStep === 3 && !selectedPixel) ||
                (currentStep === 4 && instagramAccounts.length > 0 && !selectedInstagramId)
              }
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-500/30"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ReviewItem({ title, value, id, icon, optional }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-900 bg-opacity-50 border border-gray-700 rounded-xl"
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-semibold text-white">{value || 'Not selected'}</p>
          {id && <p className="text-xs text-gray-500 mt-1">{id}</p>}
          {optional && !id && <p className="text-xs text-gray-600 italic">Optional</p>}
        </div>
      </div>
    </motion.div>
  );
}
