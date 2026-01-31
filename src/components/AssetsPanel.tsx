import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Image, Video, FileText, Users } from 'lucide-react';
import { Asset, fetchUserAssets, deleteAsset, createAsset, getDefaultWorkspace } from '../lib/assetsService';

interface AssetsPanelProps {
  userId: string;
}

export default function AssetsPanel({ userId }: AssetsPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [assetType, setAssetType] = useState<Asset['asset_type']>('image');
  const [assetText, setAssetText] = useState('');
  const [assetName, setAssetName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeAssets();
  }, [userId]);

  const initializeAssets = async () => {
    try {
      setLoading(true);
      const wsId = await getDefaultWorkspace(userId);
      if (!wsId) {
        console.error('No default workspace found');
        setLoading(false);
        return;
      }

      setWorkspaceId(wsId);
      const fetchedAssets = await fetchUserAssets(userId, wsId);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceId) {
      alert('Workspace not initialized');
      return;
    }

    if (assetType !== 'image' && assetType !== 'video' && !assetText) {
      alert('Please enter asset content');
      return;
    }

    try {
      setSubmitting(true);

      const content = {
        text: ['copy', 'testimonial'].includes(assetType) ? assetText : undefined,
        fileName: assetName || undefined,
      };

      const { asset, error } = await createAsset(userId, workspaceId, assetType, content);

      if (error) throw error;

      if (asset) {
        setAssets([asset, ...assets]);
        setAssetText('');
        setAssetName('');
        setShowAddForm(false);
      }
    } catch (error: any) {
      alert(`Failed to create asset: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await deleteAsset(assetId);
      if (error) throw error;

      setAssets(assets.filter(a => a.id !== assetId));
    } catch (error: any) {
      alert(`Failed to delete asset: ${error.message}`);
    }
  };

  const getAssetIcon = (type: Asset['asset_type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'copy':
        return <FileText className="w-5 h-5" />;
      case 'testimonial':
        return <Users className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.button
        onClick={() => setShowAddForm(!showAddForm)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Asset
      </motion.button>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleAddAsset}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as Asset['asset_type'])}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="copy">Copy</option>
                <option value="testimonial">Testimonial</option>
              </select>
            </div>

            {['copy', 'testimonial'].includes(assetType) ? (
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={assetText}
                  onChange={(e) => setAssetText(e.target.value)}
                  placeholder="Enter asset content..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g., Product Photo 1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Asset'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {assets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full text-center py-8 text-gray-400"
            >
              <p>No assets yet. Create one to get started.</p>
            </motion.div>
          ) : (
            assets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-red-600">
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {asset.file_name || `${asset.asset_type} #${asset.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{asset.asset_type}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleDeleteAsset(asset.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {asset.asset_text && (
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{asset.asset_text}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className={`px-2 py-1 rounded capitalize ${
                    asset.status === 'approved'
                      ? 'bg-green-600/20 text-green-400'
                      : asset.status === 'rejected'
                      ? 'bg-red-600/20 text-red-400'
                      : 'bg-gray-700/50'
                  }`}>
                    {asset.status}
                  </span>
                  <span>
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
