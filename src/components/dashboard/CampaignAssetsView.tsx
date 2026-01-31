import { useState, useEffect } from 'react';
import { Folder, File, Image, Video, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { campaignAssetsService, CampaignAsset } from '../../lib/campaignAssetsService';

export default function CampaignAssetsView() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [folders, setFolders] = useState<{ campaign_id: string; campaign_name: string; asset_count: number }[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<CampaignAsset | null>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const foldersData = await campaignAssetsService.getAllCampaignFolders(user.id);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderAssets = async (campaignId: string) => {
    if (!user) return;
    try {
      const assetsData = await campaignAssetsService.getCampaignAssets(user.id, campaignId);
      setAssets(assetsData);
      setSelectedFolder(campaignId);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setAssets([]);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return File;
    if (fileType.match(/jpg|jpeg|png|gif|webp/i)) return Image;
    if (fileType.match(/mp4|mov|avi|webm/i)) return Video;
    return File;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading assets...
        </div>
      </div>
    );
  }

  if (selectedFolder) {
    const currentFolder = folders.find(f => f.campaign_id === selectedFolder);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToFolders}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Back to Folders
          </button>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {currentFolder?.campaign_name}
          </h2>
        </div>

        {assets.length === 0 ? (
          <div className={`p-12 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
            No assets found in this campaign folder.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => {
              const IconComponent = getFileIcon(asset.file_type);
              const isImage = asset.file_type?.match(/jpg|jpeg|png|gif|webp/i);

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-500'
                  }`}
                >
                  <div className="aspect-square flex items-center justify-center p-4">
                    {isImage ? (
                      <img
                        src={asset.public_url}
                        alt={asset.asset_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <IconComponent className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {asset.asset_name}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {asset.file_type?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAsset(null)}>
            <div
              className={`max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAsset.asset_name}
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {selectedAsset.file_type?.match(/jpg|jpeg|png|gif|webp/i) ? (
                  <img src={selectedAsset.public_url} alt={selectedAsset.asset_name} className="w-full rounded-lg" />
                ) : selectedAsset.file_type?.match(/mp4|mov|avi|webm/i) ? (
                  <video src={selectedAsset.public_url} controls className="w-full rounded-lg" />
                ) : (
                  <div className={`p-12 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <File className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Preview not available for this file type</p>
                    <a
                      href={selectedAsset.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      Open File
                    </a>
                  </div>
                )}
                <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>File Type</p>
                      <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{selectedAsset.file_type?.toUpperCase() || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Uploaded</p>
                      <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {new Date(selectedAsset.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Campaign Assets
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Assets are organized by campaign. Click on a folder to view its assets.
        </p>
      </div>

      {folders.length === 0 ? (
        <div className={`p-12 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
          No campaign folders found. Create a campaign with assets to see them here.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.campaign_id}
              onClick={() => loadFolderAssets(folder.campaign_id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                  : 'bg-white border-gray-200 hover:border-blue-500'
              }`}
            >
              <Folder className={`w-12 h-12 mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {folder.campaign_name}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                {folder.asset_count} {folder.asset_count === 1 ? 'asset' : 'assets'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
