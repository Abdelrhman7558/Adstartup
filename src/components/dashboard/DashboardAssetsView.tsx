import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Edit3, Trash2, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Asset {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  storage_path: string;
  created_at: string;
}

export default function DashboardAssetsView() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('user-assets')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('user_assets')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_path: publicUrlData.publicUrl,
            file_size: file.size,
            storage_path: filePath,
            storage_bucket: 'user-assets'
          });

        if (dbError) throw dbError;
      }

      await fetchAssets();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Failed to upload one or more files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAssets.size === 0) return;

    const confirmed = confirm(`Delete ${selectedAssets.size} selected asset${selectedAssets.size > 1 ? 's' : ''}?`);
    if (!confirmed) return;

    setUploading(true);

    try {
      const assetsToDelete = assets.filter(asset => selectedAssets.has(asset.id));

      for (const asset of assetsToDelete) {
        const { error: storageError } = await supabase.storage
          .from('user-assets')
          .remove([asset.storage_path]);

        if (storageError) console.error('Storage delete error:', storageError);

        const { error: dbError } = await supabase
          .from('user_assets')
          .delete()
          .eq('id', asset.id)
          .eq('user_id', user?.id);

        if (dbError) throw dbError;
      }

      setAssets(prev => prev.filter(asset => !selectedAssets.has(asset.id)));
      setSelectedAssets(new Set());
      setEditMode(false);
    } catch (err) {
      console.error('Error deleting assets:', err);
      alert('Failed to delete some assets');
    } finally {
      setUploading(false);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const getAssetIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) {
      return Video;
    }
    return ImageIcon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Assets</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Upload and manage your creative assets
          </p>
        </div>

        <div className="flex gap-3">
          {editMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedAssets.size === 0 || uploading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete ({selectedAssets.size})
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedAssets(new Set());
                }}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload
                  </>
                )}
              </button>
              {assets.length > 0 && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {assets.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Assets Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Upload images and videos to use in your ad campaigns
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Assets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {assets.map((asset) => {
              const Icon = getAssetIcon(asset.file_type);
              const isSelected = selectedAssets.has(asset.id);
              const isImage = asset.file_type.startsWith('image/');

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden transition-all ${
                    editMode && isSelected
                      ? 'border-blue-600 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => editMode && toggleAssetSelection(asset.id)}
                  style={{ cursor: editMode ? 'pointer' : 'default' }}
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    {isImage ? (
                      <img
                        src={asset.file_path}
                        alt={asset.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-slate-400" />
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {asset.file_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {editMode && (
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}