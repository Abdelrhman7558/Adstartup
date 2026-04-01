import { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, AlertCircle, CheckCircle2, X, CreditCard as Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

interface UserAsset {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UploadAssetsProps {
  className?: string;
  onUploadComplete?: () => void;
}

export default function UploadAssets({ className = '', onUploadComplete }: UploadAssetsProps) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('[Assets] Load error:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [user?.id]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported. Please upload images or videos only.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
    }

    return null;
  };



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user?.id) {
      setError('No files selected');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);
    setUploadProgress(0);
    setSuccessCount(0);
    setTotalCount(0);

    const fileArray = Array.from(files).filter(file => file.size > 0);

    if (fileArray.length === 0) {
      setError('No valid files selected');
      setUploading(false);
      return;
    }

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        validationErrors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
    }

    if (validFiles.length === 0) {
      setError('No valid files to upload. Please check file types and sizes.');
      setUploading(false);
      return;
    }

    setTotalCount(validFiles.length);
    let uploadedCount = 0;

    try {
      for (const file of validFiles) {
        try {
          if (!(file instanceof File)) {
            console.error(`[Upload] Invalid file object: ${file}`);
            continue;
          }

          if (file.size === 0) {
            console.error(`[Upload] Empty file: ${file.name}`);
            continue;
          }

          console.log(`[Upload] Uploading to Supabase Storage: ${file.name} (${file.size} bytes)`);

          const now = new Date();
          const dateFolder = now.toISOString().split('T')[0];
          const timestamp = now.getTime();
          const storagePath = `${user.id}/${dateFolder}/${timestamp}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error(`[Upload] Supabase Storage failed for ${file.name}:`, uploadError);
            continue;
          }

          console.log(`[Upload] Supabase Storage success for ${file.name}`);

          const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(storagePath);

          console.log(`[Upload] Inserting into user_assets table: ${file.name}`);

          const { error: dbError } = await supabase
            .from('user_assets')
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: storagePath,
              public_url: publicUrl,
            });

          if (dbError) {
            console.error(`[Upload] Database insert failed for ${file.name}:`, dbError);
            continue;
          }

          console.log(`[Upload] Database insert success for ${file.name}`);

          uploadedCount++;
          setSuccessCount(uploadedCount);
          setUploadProgress(Math.round((uploadedCount / validFiles.length) * 100));
          console.log(`[Upload] Complete: ${file.name}`);
        } catch (fileError) {
          console.error(`[Upload] Error processing ${file.name}:`, fileError);
        }
      }

      if (uploadedCount === 0) {
        setError('No files were uploaded. Please try again.');
        setSuccess(false);
      } else {
        setSuccess(true);
        await loadAssets();
        onUploadComplete?.();
      }
    } catch (err) {
      console.error('[Assets] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAsset = async (assetId: string, storagePath: string) => {
    if (!user?.id) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('assets')
        .remove([storagePath]);

      if (storageError) {
        console.error('[Assets] Storage delete error:', storageError);
      }

      const { error: dbError } = await supabase
        .from('user_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;

      await loadAssets();
      setError(null);
    } catch (err) {
      console.error('[Assets] Delete error:', err);
      setError('Failed to delete asset');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (assets.length > 0 && !showEditMode) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Uploaded Assets</h3>
          </div>
          <button
            onClick={() => setShowEditMode(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Assets
          </button>
        </div>
        <p className="text-sm text-green-700 dark:text-green-400">
          You have {assets.length} asset{assets.length !== 1 ? 's' : ''} uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileImage className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Upload Assets</h3>
        </div>
        {showEditMode && (
          <button
            onClick={() => setShowEditMode(false)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-line">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">
            Successfully uploaded {successCount} of {totalCount} file{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {uploading && uploadProgress > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Uploading files...</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">{uploadProgress}%</p>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {showEditMode && assets.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Your Assets:</p>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.file_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {asset.file_type} • {asset.file_size ? (asset.file_size / 1024 / 1024).toFixed(2) + 'MB' : 'Unknown size'}
                </p>
              </div>
              <button
                onClick={() => handleDeleteAsset(asset.id, asset.storage_path || '')}
                className="ml-2 p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="asset-upload"
        />
        <label
          htmlFor="asset-upload"
          className={`w-full py-3 bg-black dark:bg-red-600 hover:bg-gray-900 dark:hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? `Uploading (${uploadProgress}%)...` : 'Upload Assets'}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Select files • Supported: Images (JPG, PNG, GIF, WebP, SVG) and Videos (MP4, MOV, AVI) • Max 50MB per file
        </p>
      </div>
    </div>
  );
}
