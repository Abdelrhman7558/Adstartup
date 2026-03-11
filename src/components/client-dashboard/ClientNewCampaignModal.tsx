import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight, Upload, Trash2, Camera, Loader2,
    CheckCircle, AlertCircle, Megaphone, Package, Image as ImageIcon,
    FileText, Globe, Instagram
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { campaignAssetsService } from '../../lib/campaignAssetsService';
import { buildAgentPayload, createMetaCampaign, CampaignFormData } from '../../lib/metaAdsAgentService';

interface ClientNewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface MetaPage {
    page_id: string;
    page_name: string;
}

interface MetaInstagram {
    id: string;
    username: string;
    type: string;
}

interface MetaCatalog {
    catalog_id: string;
    catalog_name: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
    { num: 1, label: 'Asset Type', icon: Package },
    { num: 2, label: 'Details', icon: FileText },
    { num: 3, label: 'Assets', icon: ImageIcon },
    { num: 4, label: 'Page', icon: Globe },
    { num: 5, label: 'Launch', icon: Megaphone },
];

export default function ClientNewCampaignModal({ isOpen, onClose, onSuccess }: ClientNewCampaignModalProps) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState<Step>(1);

    // Step 1: Asset Type
    const [assetType, setAssetType] = useState<'catalog' | 'upload' | ''>('');

    // Step 2: Campaign Details
    const [campaignName, setCampaignName] = useState('');
    const [dailyBudget, setDailyBudget] = useState('500');
    const [currency, setCurrency] = useState('EGP');
    const [description, setDescription] = useState('');
    const [offer, setOffer] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Step 3: Assets
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [selectedCatalogName, setSelectedCatalogName] = useState('');
    const [catalogs, setCatalogs] = useState<MetaCatalog[]>([]);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

    // Step 4: Page & Instagram
    const [selectedPageId, setSelectedPageId] = useState('');
    const [selectedPageName, setSelectedPageName] = useState('');
    const [pages, setPages] = useState<MetaPage[]>([]);
    const [selectedInstagramId, setSelectedInstagramId] = useState('');
    const [selectedInstagramName, setSelectedInstagramName] = useState('');
    const [instagramAccounts, setInstagramAccounts] = useState<MetaInstagram[]>([]);

    // Pixel
    const [selectedPixelId, setSelectedPixelId] = useState('');
    const [selectedPixelName, setSelectedPixelName] = useState('');

    // State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Prevent accidental navigation during creation
    useEffect(() => {
        if (!loading) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Campaign creation is in progress. Are you sure you want to leave?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [loading]);

    const safeClose = useCallback(() => {
        if (loading) return;
        onClose();
    }, [loading, onClose]);

    useEffect(() => {
        if (isOpen && user) {
            loadPages();
            loadCatalogs();
            loadPixelsForAccount();
            resetForm();
        }
    }, [isOpen, user]);

    const resetForm = () => {
        setCurrentStep(1);
        setAssetType('');
        setCampaignName('');
        setDailyBudget('500');
        setCurrency('EGP');
        setDescription('');
        setOffer('');
        setStartTime('');
        setEndTime('');
        setSelectedCatalogId('');
        setSelectedCatalogName('');
        setFilesToUpload([]);
        setSelectedPageId('');
        setSelectedPageName('');
        setSelectedInstagramId('');
        setSelectedInstagramName('');
        setSelectedPixelId('');
        setSelectedPixelName('');
        setError('');
        setStatusMessage('');
    };

    const loadPages = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.functions.invoke('get-pages');

            if (error) throw error;
            const formatted = (data?.data || [])
                .filter((item: any) => item.page_id && item.page_name)
                .map((item: any) => ({ page_id: item.page_id, page_name: item.page_name }));
            setPages(formatted);
        } catch (err) {
            console.error('Failed to load pages:', err);
        }
    };

    const loadCatalogs = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.functions.invoke('get-catalogs');
            if (error) throw error;
            const formatted = (data?.data || []).map((item: any) => ({
                catalog_id: item.id,
                catalog_name: item.name
            }));
            setCatalogs(formatted);
        } catch (err) {
            console.error('Failed to load catalogs:', err);
        }
    };

    const loadInstagramAccounts = async (pageId: string) => {
        if (!user || !pageId) return;
        try {
            const { data, error } = await supabase.functions.invoke('get-instagram-accounts', {
                body: { page_id: pageId }
            });
            if (error) throw error;
            setInstagramAccounts(data?.data || []);
            if (data?.data?.length === 1) {
                setSelectedInstagramId(data.data[0].id);
                setSelectedInstagramName(data.data[0].username);
            } else {
                setSelectedInstagramId('');
                setSelectedInstagramName('');
            }
        } catch (err) {
            console.error('Failed to load instagram accounts:', err);
            setInstagramAccounts([]);
        }
    };

    const loadPixelsForAccount = async () => {
        if (!user) return;
        try {
            const { data: metaConn } = await supabase
                .from('meta_connections')
                .select('ad_account_id')
                .eq('user_id', user.id)
                .eq('is_connected', true)
                .maybeSingle();

            if (metaConn?.ad_account_id) {
                const { data, error } = await supabase.functions.invoke('get-pixels', {
                    body: { ad_account_id: metaConn.ad_account_id }
                });
                if (error) throw error;
                const fetchedPixels = data?.data || [];
                if (fetchedPixels.length > 0) {
                    setSelectedPixelId(fetchedPixels[0].id);
                    setSelectedPixelName(fetchedPixels[0].name);
                }
            }
        } catch (err) {
            console.error('Failed to load pixels:', err);
        }
    };

    // Budget options based on asset type and currency
    const getBudgetOptions = () => {
        if (assetType === 'upload') {
            if (currency === 'EGP') return [500, 1250];
            if (currency === 'USD') return [40, 75];
            if (currency === 'SAR' || currency === 'AED') return [150, 275];
        } else if (assetType === 'catalog') {
            if (currency === 'EGP') return [500, 750];
            if (currency === 'USD') return [40, 50];
            if (currency === 'SAR' || currency === 'AED') return [150, 200];
        }
        return [];
    };

    const getAssetLimits = () => {
        const budget = Number(dailyBudget);
        const isLow = (currency === 'EGP' && budget <= 500) ||
            (currency === 'USD' && budget <= 40) ||
            ((currency === 'SAR' || currency === 'AED') && budget <= 150);
        return isLow ? { min: 3, max: 10 } : { min: 5, max: 25 };
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const limits = getAssetLimits();
        const totalFiles = filesToUpload.length + files.length;
        if (totalFiles > limits.max) {
            setError(`Maximum ${limits.max} files allowed for this budget`);
            return;
        }
        setFilesToUpload(prev => [...prev, ...files]);
        setError('');
    };

    const removeFile = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    // Update budget when currency or asset type changes
    useEffect(() => {
        const options = getBudgetOptions();
        if (options.length > 0 && !options.includes(Number(dailyBudget))) {
            setDailyBudget(options[0].toString());
        }
    }, [assetType, currency]);

    // Step validation and navigation
    const canProceed = (): boolean => {
        setError('');
        if (currentStep === 1) {
            if (!assetType) { setError('Please select Catalog or Upload Assets'); return false; }
        }
        if (currentStep === 2) {
            if (!campaignName) { setError('Campaign name is required'); return false; }
            if (!description) { setError('Description is required'); return false; }
            if (!startTime) { setError('Start time is required'); return false; }
        }
        if (currentStep === 3) {
            if (assetType === 'catalog' && !selectedCatalogId) {
                setError('Please select a catalog'); return false;
            }
            if (assetType === 'upload') {
                const limits = getAssetLimits();
                if (filesToUpload.length < limits.min) {
                    setError(`Need at least ${limits.min} files for this budget`); return false;
                }
            }
        }
        if (currentStep === 4) {
            if (!selectedPageId) { setError('Please select a Facebook Page'); return false; }
        }
        return true;
    };

    const handleNext = async () => {
        if (!canProceed()) return;

        if (currentStep === 4) {
            // Load Instagram accounts before moving to review
            await loadInstagramAccounts(selectedPageId);
        }

        if (currentStep < 5) {
            setCurrentStep((currentStep + 1) as Step);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as Step);
            setError('');
        }
    };

    // ─── Submit: Create the full campaign ────────────────────────────
    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            setStatusMessage('Creating campaign draft...');

            // 1. Create campaign record in DB
            const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .insert([{
                    user_id: user.id,
                    name: campaignName,
                    objective: 'sales',
                    status: 'draft',
                    description,
                    budget: Number(dailyBudget),
                    start_date: new Date(startTime).toISOString(),
                    end_date: endTime ? new Date(endTime).toISOString() : null,
                    campaign_name: campaignName,
                    start_datetime: startTime,
                    end_datetime: endTime || null,
                    page_id: selectedPageId,
                    page_name: selectedPageName,
                }])
                .select()
                .single();

            if (campaignError) throw campaignError;
            if (!campaignData) throw new Error('Failed to create campaign');

            // 2. Upload assets if upload type
            if (assetType === 'upload' && filesToUpload.length > 0) {
                let fileIndex = 0;
                for (const file of filesToUpload) {
                    fileIndex++;
                    setStatusMessage(`Uploading file ${fileIndex} of ${filesToUpload.length}...`);
                    try {
                        await campaignAssetsService.uploadAsset(
                            user.id,
                            campaignData.id,
                            campaignName,
                            file
                        );
                    } catch (uploadErr) {
                        console.error(`Failed to upload ${file.name}:`, uploadErr);
                    }
                }
            }

            // 3. Build agent payload
            setStatusMessage('Preparing campaign data...');

            const campaignFormData: CampaignFormData = {
                campaign_id: campaignData.id,
                campaign_name: campaignName,
                objective: 'sales',
                goal: 'increase sales',
                daily_budget: Number(dailyBudget),
                currency,
                start_time: startTime,
                end_time: endTime || null,
                description,
                offer: offer || null,
                asset_type: assetType as 'catalog' | 'upload',
                selected_catalog_id: selectedCatalogId || undefined,
                selected_catalog_name: selectedCatalogName || undefined,
                selected_page_id: selectedPageId || undefined,
                selected_page_name: selectedPageName || undefined,
                selected_instagram_id: selectedInstagramId || undefined,
                selected_pixel_id: selectedPixelId || undefined,
                selected_pixel_name: selectedPixelName || undefined,
            };

            const { payload: agentPayload, error: buildError } = await buildAgentPayload(user.id, campaignFormData);
            if (buildError || !agentPayload) {
                throw new Error(buildError || 'Failed to build campaign data');
            }

            // 4. Create campaign on Meta
            setStatusMessage('Creating campaign on Meta...');
            const agentResult = await createMetaCampaign(agentPayload);
            if (!agentResult.success) {
                throw new Error(agentResult.error || 'Failed to create campaign on Meta');
            }

            setStatusMessage('Campaign created successfully! 🎉');
            await new Promise(resolve => setTimeout(resolve, 1500));

            resetForm();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Campaign creation error:', err);
            setError(err.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const budgetOptions = getBudgetOptions();
    const assetLimits = getAssetLimits();

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">New Campaign</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Step {currentStep} of 5 — {STEPS[currentStep - 1].label}</p>
                    </div>
                    <button
                        onClick={safeClose}
                        disabled={loading}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center gap-1">
                        {STEPS.map((step, i) => (
                            <div key={step.num} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                    currentStep >= step.num
                                        ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                                        : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {currentStep > step.num ? <CheckCircle className="w-4 h-4" /> : step.num}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                                        currentStep > step.num ? 'bg-red-400' : 'bg-gray-100'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Status */}
                    {loading && statusMessage && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                            {statusMessage}
                        </div>
                    )}

                    {/* ── STEP 1: Asset Type ────────────────────────────── */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">How will you provide assets for your campaign?</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setAssetType('catalog'); setError(''); }}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                                        assetType === 'catalog'
                                            ? 'border-red-500 bg-red-50/50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <Package className={`w-8 h-8 mb-3 ${assetType === 'catalog' ? 'text-red-500' : 'text-gray-400'}`} />
                                    <h3 className="font-bold text-gray-900 text-sm">Meta Catalog</h3>
                                    <p className="text-xs text-gray-500 mt-1">Use products from your connected catalog</p>
                                </button>
                                <button
                                    onClick={() => { setAssetType('upload'); setError(''); }}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                                        assetType === 'upload'
                                            ? 'border-red-500 bg-red-50/50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <Upload className={`w-8 h-8 mb-3 ${assetType === 'upload' ? 'text-red-500' : 'text-gray-400'}`} />
                                    <h3 className="font-bold text-gray-900 text-sm">Upload Assets</h3>
                                    <p className="text-xs text-gray-500 mt-1">Upload images & videos</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Campaign Details ────────────────────── */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Campaign Name *</label>
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={e => setCampaignName(e.target.value)}
                                    placeholder="e.g. Summer Sale 2026"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What is this campaign about?"
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Offer (optional)</label>
                                <input
                                    type="text"
                                    value={offer}
                                    onChange={e => setOffer(e.target.value)}
                                    placeholder="e.g. 20% off, Buy 1 Get 1 Free"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                                    <select
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                    >
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                        <option value="SAR">SAR</option>
                                        <option value="AED">AED</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Daily Budget</label>
                                    {budgetOptions.length > 0 ? (
                                        <div className="flex gap-2">
                                            {budgetOptions.map(b => (
                                                <button
                                                    key={b}
                                                    onClick={() => setDailyBudget(b.toString())}
                                                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                        Number(dailyBudget) === b
                                                            ? 'border-red-400 bg-red-50 text-red-600'
                                                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {b} {currency}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={dailyBudget}
                                            onChange={e => setDailyBudget(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date *</label>
                                    <input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Assets ──────────────────────────────── */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            {assetType === 'catalog' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Catalog</label>
                                    {catalogs.length > 0 ? (
                                        <div className="space-y-2">
                                            {catalogs.map(cat => (
                                                <button
                                                    key={cat.catalog_id}
                                                    onClick={() => {
                                                        setSelectedCatalogId(cat.catalog_id);
                                                        setSelectedCatalogName(cat.catalog_name);
                                                    }}
                                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                                                        selectedCatalogId === cat.catalog_id
                                                            ? 'border-red-500 bg-red-50/50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Package className={`w-5 h-5 ${selectedCatalogId === cat.catalog_id ? 'text-red-500' : 'text-gray-400'}`} />
                                                    <span className="font-medium text-gray-900 text-sm">{cat.catalog_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                            <p className="text-sm text-yellow-800">No catalogs found. Please connect a catalog in your Integration settings.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Upload Images/Videos ({filesToUpload.length}/{assetLimits.max})
                                    </label>
                                    <p className="text-xs text-gray-400 mb-3">Minimum {assetLimits.min}, maximum {assetLimits.max} files</p>

                                    {/* Upload area */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <Upload className="w-8 h-8 text-gray-300" />
                                        <span className="text-sm font-medium text-gray-500">Click to upload files</span>
                                        <span className="text-xs text-gray-400">Images (PNG, JPG, WebP) & Videos (MP4)</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {/* File list */}
                                    {filesToUpload.length > 0 && (
                                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                            {filesToUpload.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {file.type.startsWith('image/') ? (
                                                            <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                        ) : (
                                                            <Camera className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                        )}
                                                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: Page & Instagram ───────────────────── */}
                    {currentStep === 4 && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    <Globe className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                    Facebook Page *
                                </label>
                                {pages.length > 0 ? (
                                    <div className="space-y-2">
                                        {pages.map(page => (
                                            <button
                                                key={page.page_id}
                                                onClick={() => {
                                                    setSelectedPageId(page.page_id);
                                                    setSelectedPageName(page.page_name);
                                                }}
                                                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                                                    selectedPageId === page.page_id
                                                        ? 'border-red-500 bg-red-50/50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    selectedPageId === page.page_id ? 'bg-red-100' : 'bg-blue-50'
                                                }`}>
                                                    <span className={`text-sm font-bold ${selectedPageId === page.page_id ? 'text-red-500' : 'text-blue-600'}`}>f</span>
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm">{page.page_name}</span>
                                                {selectedPageId === page.page_id && (
                                                    <CheckCircle className="w-4 h-4 text-red-500 ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                        <p className="text-sm text-yellow-800">No pages found. Connect your pages in Integration settings.</p>
                                    </div>
                                )}
                            </div>

                            {/* Instagram (loaded after page selection, but show if any) */}
                            {instagramAccounts.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        <Instagram className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                        Instagram Account (optional)
                                    </label>
                                    <div className="space-y-2">
                                        {instagramAccounts.map(ig => (
                                            <button
                                                key={ig.id}
                                                onClick={() => {
                                                    setSelectedInstagramId(ig.id);
                                                    setSelectedInstagramName(ig.username);
                                                }}
                                                className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                                                    selectedInstagramId === ig.id
                                                        ? 'border-red-500 bg-red-50/50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500`}>
                                                    <span className="text-xs font-bold text-white">Ig</span>
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm">@{ig.username}</span>
                                                {selectedInstagramId === ig.id && (
                                                    <CheckCircle className="w-4 h-4 text-red-500 ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 5: Review & Launch ────────────────────── */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                <h3 className="font-bold text-gray-900 text-sm">Campaign Summary</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">Name</span>
                                        <p className="text-gray-900 font-semibold truncate">{campaignName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">Budget</span>
                                        <p className="text-gray-900 font-semibold">{dailyBudget} {currency}/day</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">Asset Type</span>
                                        <p className="text-gray-900 font-semibold capitalize">{assetType}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">
                                            {assetType === 'catalog' ? 'Catalog' : 'Files'}
                                        </span>
                                        <p className="text-gray-900 font-semibold">
                                            {assetType === 'catalog' ? selectedCatalogName : `${filesToUpload.length} files`}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">Page</span>
                                        <p className="text-gray-900 font-semibold truncate">{selectedPageName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-medium">Start</span>
                                        <p className="text-gray-900 font-semibold">{startTime ? new Date(startTime).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                                {description && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <span className="text-gray-500 text-xs font-medium">Description</span>
                                        <p className="text-gray-700 text-sm mt-0.5">{description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                <p className="text-xs text-blue-700 font-medium">
                                    🚀 This will create a full campaign on Meta including Campaign, Ad Set, Creative, and Ad. The campaign will start in <strong>Paused</strong> status so you can review it before going live.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    {currentStep > 1 ? (
                        <button
                            onClick={handleBack}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 5 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1.5 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200 disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Megaphone className="w-4 h-4" />
                                    Launch Campaign
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
