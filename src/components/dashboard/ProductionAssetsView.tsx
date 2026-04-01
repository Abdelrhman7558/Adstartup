import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Upload, FileIcon, Trash2, X, Loader, Image, Video, FileText, ChevronDown, ChevronRight, Folder, AlertCircle } from 'lucide-react';
import { getStandaloneAssets, getUserCampaigns, getCampaignAssets, deleteStandaloneAsset, CampaignAsset, Campaign } from '../../lib/campaignService';
import StandaloneUploadModal from './StandaloneUploadModal';

export default function ProductionAssetsView() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [standaloneAssets, setStandaloneAssets] = useState<CampaignAsset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignAssets, setCampaignAssets] = useState<Map<string, CampaignAsset[]>>(new Map());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set(['standalone']));
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAllAssets();
      const interval = setInterval(() => {
        loadAllAssets();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadAllAssets = async () => {
    if (!user) return;

    setIsLoading(true);

    const standalone = await getStandaloneAssets(user.id);
    setStandaloneAssets(standalone);

    const userCampaigns = await getUserCampaigns(user.id);
    setCampaigns(userCampaigns);

    const assetsMap = new Map<string, CampaignAsset[]>();
    for (const campaign of userCampaigns) {
      const assets = await getCampaignAssets(user.id, campaign.id);
      if (assets.length > 0) {
        assetsMap.set(campaign.id, assets);
      }
    }
    setCampaignAssets(assetsMap);

    setIsLoading(false);
  };

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedAssets.size === 0 || !user) return;

    setIsDeleting(true);
    setError(null);

    try {
      const allAssets = [...standaloneAssets, ...Array.from(campaignAssets.values()).flat()];
      const assetsToDelete = allAssets.filter(asset => selectedAssets.has(asset.id));

      let deletedCount = 0;
      for (const asset of assetsToDelete) {
        const { error } = await deleteStandaloneAsset(user.id, asset.id, asset.storage_path);
        if (!error) {
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        setSuccess(`Successfully deleted ${deletedCount} ${deletedCount === 1 ? 'file' : 'files'}`);
        setSelectedAssets(new Set());
        setIsEditMode(false);
        await loadAllAssets();
      } else {
        setError('Failed to delete files');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete files');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    return FileIcon;
  };

  const getFilePreview = (asset: CampaignAsset) => {
    if (asset.file_type.startsWith('image/') && asset.public_url) {
      return (
        <img
          src={asset.public_url}
          alt={asset.file_name}
          className="w-full h-32 object-cover rounded-lg"
        />
      );
    }
    if (asset.file_type.startsWith('video/') && asset.public_url) {
      return (
        <video
          src={asset.public_url}
          className="w-full h-32 object-cover rounded-lg"
          muted
        />
      );
    }
    const Icon = getFileIcon(asset.file_type);
    return (
      <div className={`w-full h-32 flex items-center justify-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <Icon className={`w-12 h-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const totalAssets = standaloneAssets.length + Array.from(campaignAssets.values()).flat().length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-600 dark:text-green-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Assets
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {totalAssets} {totalAssets === 1 ? 'file' : 'files'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-5 h-5" />
              Upload Assets
            </button>

            {totalAssets > 0 && (
              <button
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  setSelectedAssets(new Set());
                }}
                className={`px-6 py-2 rounded-xl font-semibold transition-colors ${
                  isEditMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {isEditMode && selectedAssets.size > 0 && (
          <div className="mb-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {selectedAssets.size} {selectedAssets.size === 1 ? 'file' : 'files'} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </>
              )}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
        ) : totalAssets === 0 ? (
          <div className="text-center py-16">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Upload className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No assets yet
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload your first asset to get started
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-2 rounded-xl font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              Upload Assets
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {standaloneAssets.length > 0 && (
              <div className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  onClick={() => toggleCampaign('standalone')}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } rounded-xl`}
                >
                  <div className="flex items-center gap-3">
                    {expandedCampaigns.has('standalone') ? (
                      <ChevronDown className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                    <Folder className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className="text-left">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Standalone Assets
                      </h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {standaloneAssets.length} {standaloneAssets.length === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                  </div>
                </button>

                {expandedCampaigns.has('standalone') && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {standaloneAssets.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => isEditMode && toggleAssetSelection(asset.id)}
                        className={`rounded-xl p-4 transition-all cursor-pointer ${
                          selectedAssets.has(asset.id)
                            ? 'ring-2 ring-blue-500'
                            : theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="mb-3">
                          {getFilePreview(asset)}
                        </div>
                        <h4 className={`text-sm font-semibold truncate mb-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {asset.file_name}
                        </h4>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <p>{formatFileSize(asset.file_size)}</p>
                          <p>{formatDate(asset.uploaded_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {campaigns.map((campaign) => {
              const assets = campaignAssets.get(campaign.id) || [];
              if (assets.length === 0) return null;

              return (
                <div
                  key={campaign.id}
                  className={`rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
                >
                  <button
                    onClick={() => toggleCampaign(campaign.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } rounded-xl`}
                  >
                    <div className="flex items-center gap-3">
                      {expandedCampaigns.has(campaign.id) ? (
                        <ChevronDown className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      )}
                      <Folder className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className="text-left">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {campaign.name}
                        </h3>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assets.length} {assets.length === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {expandedCampaigns.has(campaign.id) && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => isEditMode && toggleAssetSelection(asset.id)}
                          className={`rounded-xl p-4 transition-all cursor-pointer ${
                            selectedAssets.has(asset.id)
                              ? 'ring-2 ring-blue-500'
                              : theme === 'dark'
                              ? 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="mb-3">
                            {getFilePreview(asset)}
                          </div>
                          <h4 className={`text-sm font-semibold truncate mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {asset.file_name}
                          </h4>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>{formatFileSize(asset.file_size)}</p>
                            <p>{formatDate(asset.uploaded_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StandaloneUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          loadAllAssets();
        }}
      />
    </div>
  );
}
