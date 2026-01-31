import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { campaignAssetsService } from '../../lib/campaignAssetsService';
import { sendCampaignToWebhook } from '../../lib/webhookService';

interface NewCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface MetaPage {
    page_id: string;
    page_name: string;
}

interface MetaCatalog {
    catalog_id: string;
    catalog_name: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const OBJECTIVE_OPTIONS = ['sales'];
const GOAL_OPTIONS = ['increase sales'];

export default function NewCampaignModal({ isOpen, onClose, onSuccess }: NewCampaignModalProps) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState<Step>(1);

    const [assetType, setAssetType] = useState<'catalog' | 'upload' | ''>('');
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [selectedCatalogName, setSelectedCatalogName] = useState('');
    const [catalogs, setCatalogs] = useState<MetaCatalog[]>([]);

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

    const [campaignName, setCampaignName] = useState('');
    const [objective, setObjective] = useState('');
    const [goal, setGoal] = useState('');
    const [dailyBudget, setDailyBudget] = useState('500');
    const [currency, setCurrency] = useState('EGP');
    const [description, setDescription] = useState('');
    const [offer, setOffer] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [selectedPageId, setSelectedPageId] = useState('');
    const [selectedPageName, setSelectedPageName] = useState('');
    const [pages, setPages] = useState<MetaPage[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadPages();
            loadCatalogs();
            resetForm();
        }
    }, [isOpen, user]);

    const resetForm = () => {
        setCurrentStep(1);
        setAssetType('');
        setSelectedCatalogId('');
        setSelectedCatalogName('');
        setUploadedFiles([]);
        setFilesToUpload([]);
        setCampaignName('');
        setObjective('');
        setGoal('');
        setDescription('');
        setOffer('');
        setStartTime('');
        setEndTime('');
        setSelectedPageId('');
        setSelectedPageName('');
        setError('');
    };

    const loadPages = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('meta_connections')
                .select('page_id, page_name')
                .eq('user_id', user.id)
                .eq('is_connected', true)
                .not('page_id', 'is', null)
                .not('page_name', 'is', null);

            if (error) throw error;

            const formattedPages = (data || [])
                .filter(item => item.page_id && item.page_name)
                .map(item => ({
                    page_id: item.page_id,
                    page_name: item.page_name,
                }));

            setPages(formattedPages);

            if (formattedPages.length === 0) {
                setError('No pages found. Make sure your Meta account has pages connected.');
            }
        } catch (err) {
            console.error('Failed to load pages:', err);
            setError(err instanceof Error ? err.message : 'Failed to load pages');
            setPages([]);
        }
    };

    const loadCatalogs = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('meta_connections')
                .select('catalog_id, catalog_name')
                .eq('user_id', user.id)
                .eq('is_connected', true)
                .maybeSingle();

            if (error) throw error;
            if (data?.catalog_id && data?.catalog_name) {
                setCatalogs([{ catalog_id: data.catalog_id, catalog_name: data.catalog_name }]);
            }
        } catch (err) {
            console.error('Failed to load catalogs:', err);
        }
    };

    // Helper to determine budget options based on Asset Type and Currency
    const getBudgetOptions = (type: string, curr: string) => {
        if (type === 'upload') {
            if (curr === 'EGP') return [500, 1250];
            if (curr === 'USD') return [40, 75];
            if (curr === 'SAR' || curr === 'AED') return [150, 275];
        } else if (type === 'catalog') {
            if (curr === 'EGP') return [500, 750];
            if (curr === 'USD') return [40, 50];
            if (curr === 'SAR' || curr === 'AED') return [150, 200];
        }
        return [];
    };

    // Helper to determine asset limits based on Budget
    const getAssetLimits = (budget: number, curr: string) => {
        // Low Tier
        const isLowTier = (curr === 'EGP' && budget <= 500) ||
            (curr === 'USD' && budget <= 40) ||
            ((curr === 'SAR' || curr === 'AED') && budget <= 150);

        if (isLowTier) return { min: 3, max: 10 };
        return { min: 5, max: 25 }; // High Tier
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const limits = getAssetLimits(Number(dailyBudget), currency);
        const totalFiles = uploadedFiles.length + filesToUpload.length + files.length;

        if (totalFiles > limits.max) {
            setError(`Maximum ${limits.max} files allowed for this budget`);
            return;
        }

        setFilesToUpload(prev => [...prev, ...files]);
        setError('');
    };

    const removeFile = (index: number, isUploaded: boolean) => {
        if (isUploaded) {
            setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        } else {
            setFilesToUpload(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleNext = async () => {
        // Step 1: Asset Type Selection
        if (currentStep === 1) {
            if (!assetType) {
                setError('Please select Catalog or Upload Assets');
                return;
            }
        }

        // Step 2: Campaign Details (Moved from Step 3)
        if (currentStep === 2) {
            if (!campaignName || !objective || !goal) {
                setError('Campaign Name, Objective, and Goal are required');
                return;
            }
            if (!description || !startTime) {
                setError('Description and Start Time are required');
                return;
            }
            // Currency and Budget are always selected due to defaults/dropdowns
        }

        // Step 3: Assets (Moved from Step 2)
        if (currentStep === 3) {
            if (assetType === 'catalog') {
                if (!selectedCatalogId) {
                    setError('Please select a catalog');
                    return;
                }
            } else if (assetType === 'upload') {
                const limits = getAssetLimits(Number(dailyBudget), currency);
                const totalFiles = uploadedFiles.length + filesToUpload.length;

                if (totalFiles < limits.min) {
                    setError(`Need ${limits.min - totalFiles} more file(s) - minimum ${limits.min} required for this budget`);
                    return;
                }
                if (totalFiles > limits.max) {
                    setError(`Maximum ${limits.max} files allowed for this budget`);
                    return;
                }
            }
        }

        if (currentStep === 4) {
            if (!selectedPageId) {
                setError('Page selection is required');
                return;
            }
        }

        setError('');
        if (currentStep < 5) {
            setCurrentStep((currentStep + 1) as Step);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as Step);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError('');

            const { data: campaignData, error: campaignError } = await supabase
                .from('campaigns')
                .insert([
                    {
                        user_id: user.id,
                        name: campaignName,
                        objective,
                        status: 'draft',
                        description: description,
                        budget: Number(dailyBudget),
                        start_date: new Date(startTime).toISOString(),
                        end_date: endTime ? new Date(endTime).toISOString() : null,
                        campaign_name: campaignName,
                        start_datetime: startTime,
                        end_datetime: endTime || null,
                        page_id: selectedPageId,
                        page_name: selectedPageName,
                    },
                ])
                .select()
                .single();

            if (campaignError) throw campaignError;
            if (!campaignData) throw new Error('Failed to create campaign');

            const uploadedAssetIds: string[] = [];
            const failedUploads: string[] = [];

            if (assetType === 'upload' && filesToUpload.length > 0) {
                for (const file of filesToUpload) {
                    try {
                        const assetResult = await campaignAssetsService.uploadAsset(
                            user.id,
                            campaignData.id,
                            campaignName,
                            file
                        );
                        if (assetResult?.id) {
                            uploadedAssetIds.push(assetResult.id);
                        }
                    } catch (uploadErr) {
                        console.error(`Failed to upload file ${file.name}:`, uploadErr);
                        failedUploads.push(file.name);
                    }
                }
            }

            const webhookPayload: any = {
                user_id: user.id,
                campaign_id: campaignData.id,
                campaign_name: campaignName,
                objective,
                goal,
                daily_budget: Number(dailyBudget),
                currency,
                description,
                start_time: startTime,
                end_time: endTime || null,
                selected_page: selectedPageId,
                type: assetType === 'catalog' ? 'catalog' : 'assets',
                campaign_objective: objective,
                target_country: '',
                campaign_notes: description,
                timestamp: new Date().toISOString(),
            };

            if (offer) {
                webhookPayload.offer = offer;
            }

            if (assetType === 'catalog' && selectedCatalogId) {
                webhookPayload.catalog_id = selectedCatalogId;
            }

            if (assetType === 'upload' && uploadedAssetIds.length > 0) {
                webhookPayload.assets_ids = uploadedAssetIds;
            }

            const webhookResult = await sendCampaignToWebhook(webhookPayload);
            if (!webhookResult.success) {
                throw new Error(`Webhook failed: ${webhookResult.error}`);
            }

            resetForm();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Campaign Creation Error:', err);
            let msg = 'Failed to create campaign';

            if (err instanceof Error) {
                msg = err.message;
            } else if (typeof err === 'object' && err !== null) {
                msg = err.message || err.error_description || JSON.stringify(err);
            } else {
                msg = String(err);
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Update budget when currency or asset type changes
    useEffect(() => {
        const options = getBudgetOptions(assetType, currency);
        if (options.length > 0 && !options.includes(Number(dailyBudget))) {
            setDailyBudget(options[0].toString());
        }
    }, [assetType, currency]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
                className={`rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                <div
                    className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                >
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        New Campaign - Step {currentStep} of 5
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">{error}</p>
                        </div>
                    )}

                    {/* STEP 1: Asset Type Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                How would you like to provide assets for your campaign?
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => {
                                        setAssetType('catalog');
                                        setError('');
                                    }}
                                    className={`p-8 rounded-2xl border-2 transition-all ${assetType === 'catalog'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                                        : theme === 'dark'
                                            ? 'border-gray-700 hover:border-gray-600 bg-gray-700'
                                            : 'border-gray-300 hover:border-gray-400 bg-white'
                                        }`}
                                >
                                    <div className={`text-4xl mb-4 ${assetType === 'catalog' ? 'text-blue-600' : 'text-gray-400'}`}>
                                        📦
                                    </div>
                                    <h3
                                        className={`text-xl font-bold mb-2 ${assetType === 'catalog'
                                            ? 'text-blue-900 dark:text-blue-100'
                                            : theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                            }`}
                                    >
                                        Meta Catalog
                                    </h3>
                                    <p
                                        className={`text-sm ${assetType === 'catalog'
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                            }`}
                                    >
                                        Use products from your connected catalog
                                    </p>
                                </button>

                                <button
                                    onClick={() => {
                                        setAssetType('upload');
                                        setError('');
                                    }}
                                    className={`p-8 rounded-2xl border-2 transition-all ${assetType === 'upload'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                                        : theme === 'dark'
                                            ? 'border-gray-700 hover:border-gray-600 bg-gray-700'
                                            : 'border-gray-300 hover:border-gray-400 bg-white'
                                        }`}
                                >
                                    <div className={`text-4xl mb-4 ${assetType === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
                                        ⬆️
                                    </div>
                                    <h3
                                        className={`text-xl font-bold mb-2 ${assetType === 'upload'
                                            ? 'text-blue-900 dark:text-blue-100'
                                            : theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                            }`}
                                    >
                                        Upload Assets
                                    </h3>
                                    <p
                                        className={`text-sm ${assetType === 'upload'
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                            }`}
                                    >
                                        Upload images/videos
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Campaign Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Campaign Name *
                                </label>
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    placeholder="Enter campaign name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Objective *
                                    </label>
                                    <select
                                        value={objective}
                                        onChange={(e) => setObjective(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    >
                                        <option value="">Select objective</option>
                                        {OBJECTIVE_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Goal *
                                    </label>
                                    <select
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    >
                                        <option value="">Select goal</option>
                                        {GOAL_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Description *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    placeholder="Describe your campaign"
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Currency *
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border mb-4 ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                >
                                    <option value="EGP">EGP (Egyptian Pound)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                    <option value="SAR">SAR (Saudi Riyal)</option>
                                    <option value="AED">AED (UAE Dirham)</option>
                                </select>

                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Daily Budget *
                                </label>
                                <select
                                    value={dailyBudget}
                                    onChange={(e) => setDailyBudget(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                >
                                    {getBudgetOptions(assetType, currency).map((amount) => (
                                        <option key={amount} value={amount}>
                                            {currency === 'USD' ? `$${amount}/day` : `${amount} ${currency}/day`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Start Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        End Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Offer (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={offer}
                                    onChange={(e) => setOffer(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                    placeholder="Enter offer details (optional)"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Assets - Catalog */}
                    {currentStep === 3 && assetType === 'catalog' && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Select Your Catalog
                                </label>
                                <select
                                    value={selectedCatalogId}
                                    onChange={(e) => {
                                        const catalog = catalogs.find(c => c.catalog_id === e.target.value);
                                        setSelectedCatalogId(e.target.value);
                                        setSelectedCatalogName(catalog?.catalog_name || '');
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                >
                                    <option value="">Select a catalog</option>
                                    {catalogs.map((catalog) => (
                                        <option key={catalog.catalog_id} value={catalog.catalog_id}>
                                            {catalog.catalog_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCatalogName && (
                                <div className={`p-4 rounded-xl border-2 border-green-600 bg-green-50 dark:bg-green-900/20`}>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        ✓ Catalog selected: <strong>{selectedCatalogName}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Assets - Upload */}
                    {currentStep === 3 && assetType === 'upload' && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Upload Files (Min: {getAssetLimits(Number(dailyBudget), currency).min}, Max: {getAssetLimits(Number(dailyBudget), currency).max})
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,video/*"
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadedFiles.length + filesToUpload.length >= getAssetLimits(Number(dailyBudget), currency).max}
                                    className={`w-full px-6 py-8 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 ${uploadedFiles.length + filesToUpload.length >= getAssetLimits(Number(dailyBudget), currency).max
                                        ? theme === 'dark'
                                            ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                        : theme === 'dark'
                                            ? 'border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400'
                                            : 'border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600'
                                        }`}
                                >
                                    <Upload className="w-6 h-6" />
                                    <span className="font-medium">Click to upload files</span>
                                    <span className="text-xs opacity-75">or drag and drop</span>
                                </button>

                                <div
                                    className={`text-center p-3 rounded-lg ${uploadedFiles.length + filesToUpload.length >= getAssetLimits(Number(dailyBudget), currency).min
                                        ? theme === 'dark'
                                            ? 'bg-green-900/20 text-green-300'
                                            : 'bg-green-50 text-green-700'
                                        : theme === 'dark'
                                            ? 'bg-red-900/20 text-red-300'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                >
                                    <p className="text-sm font-medium">
                                        {uploadedFiles.length + filesToUpload.length} / {getAssetLimits(Number(dailyBudget), currency).max} files
                                        {uploadedFiles.length + filesToUpload.length < getAssetLimits(Number(dailyBudget), currency).min &&
                                            ` - Need ${getAssetLimits(Number(dailyBudget), currency).min - (uploadedFiles.length + filesToUpload.length)} more`}
                                    </p>
                                </div>
                            </div>

                            {(uploadedFiles.length > 0 || filesToUpload.length > 0) && (
                                <div
                                    className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Files ({uploadedFiles.length + filesToUpload.length})
                                    </h4>

                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {uploadedFiles.map((file, idx) => (
                                            <div
                                                key={`uploaded-${idx}`}
                                                className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50 border border-green-200'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                                                        ✓ {file.name}
                                                    </p>
                                                    <p className={`text-xs ${theme === 'dark' ? 'text-green-400/70' : 'text-green-600/70'}`}>
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB - Uploaded
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(idx, true)}
                                                    className={`ml-2 p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-red-900/30' : 'hover:bg-red-100'
                                                        }`}
                                                >
                                                    <Trash2 className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                                </button>
                                            </div>
                                        ))}

                                        {filesToUpload.map((file, idx) => (
                                            <div
                                                key={`pending-${idx}`}
                                                className={`flex items-center justify-between p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-white border border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                                                        {file.name}
                                                    </p>
                                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB - Ready to upload
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(idx, false)}
                                                    className={`ml-2 p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-red-900/30' : 'hover:bg-red-100'
                                                        }`}
                                                >
                                                    <Trash2 className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: Page Selection */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Select Page *
                                </label>
                                <select
                                    value={selectedPageId}
                                    onChange={(e) => {
                                        const page = pages.find(p => p.page_id === e.target.value);
                                        setSelectedPageId(e.target.value);
                                        setSelectedPageName(page?.page_name || '');
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                >
                                    <option value="">Select a page</option>
                                    {pages.map((page) => (
                                        <option key={page.page_id} value={page.page_id}>
                                            {page.page_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Review Campaign
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Campaign Name
                                    </p>
                                    <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {campaignName}
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Objective
                                    </p>
                                    <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {objective}
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Goal
                                    </p>
                                    <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {goal}
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Assets Type
                                    </p>
                                    <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {assetType === 'catalog' ? `Catalog - ${selectedCatalogName}` : `Upload - ${uploadedFiles.length + filesToUpload.length} files`}
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Selected Page
                                    </p>
                                    <p className={`text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedPageName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className={`flex gap-3 p-6 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                        }`}
                >
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${theme === 'dark'
                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>
                    )}

                    {currentStep < 5 && (
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-xl font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    )}

                    {currentStep === 5 && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-xl font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Campaign...' : 'Create Campaign'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
