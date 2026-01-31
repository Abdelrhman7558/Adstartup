import { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, AlertCircle, CheckCircle2, X, Trash2 } from 'lucide-react';
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
  'video/mpeg',
];

interface Asset {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  uploaded_at: string;
}

interface UploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function AssetUpload() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploads, setUploads] = useState<Map<string, UploadState>>(new Map());
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadAssets();
    }
  }, [user?.id]);

  const loadAssets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_asset')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size === 0) {
      return 'File is empty';
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" not supported`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!user?.id) return false;

    const fileKey = `${file.name}-${Date.now()}`;
    const validationError = validateFile(file);

    if (validationError) {
      setUploads(prev => new Map(prev).set(fileKey, {
        file,
        status: 'error',
        progress: 0,
        error: validationError,
      }));
      return false;
    }

    setUploads(prev => new Map(prev).set(fileKey, {
      file,
      status: 'uploading',
      progress: 0,
    }));

    try {
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
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(storagePath);

      const { error: dbError } = await supabase
        .from('users_asset')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          public_url: publicUrl,
        });

      if (dbError) {
        await supabase.storage.from('assets').remove([storagePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      setUploads(prev => new Map(prev).set(fileKey, {
        file,
        status: 'success',
        progress: 100,
      }));

      await loadAssets();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploads(prev => new Map(prev).set(fileKey, {
        file,
        status: 'error',
        progress: 0,
        error: errorMessage,
      }));
      return false;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadFile(file));
    await Promise.all(uploadPromises);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteAsset = async (assetId: string, storagePath: string) => {
    if (!user?.id) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('assets')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('users_asset')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      await loadAssets();
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  const successCount = Array.from(uploads.values()).filter(u => u.status === 'success').length;
  const errorCount = Array.from(uploads.values()).filter(u => u.status === 'error').length;
  const uploadingCount = Array.from(uploads.values()).filter(u => u.status === 'uploading').length;
  const totalUploads = uploads.size;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Assets</h3>

        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-700 font-medium">Click to upload or drag files</p>
          <p className="text-sm text-slate-500">Images and videos up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept={ALLOWED_FILE_TYPES.join(',')}
            className="hidden"
          />
        </div>

        {totalUploads > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-slate-900">Upload Queue</h4>
            {Array.from(uploads.entries()).map(([key, state]) => (
              <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{state.file.name}</p>
                    <p className="text-xs text-slate-500">{(state.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {state.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {state.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>

                {state.status === 'uploading' && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${state.progress}%` }}></div>
                  </div>
                )}

                {state.error && <p className="text-xs text-red-600 mt-2">{state.error}</p>}
              </div>
            ))}

            {totalUploads > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  {successCount > 0 && <span className="text-green-600 font-medium">{successCount} successful</span>}
                  {successCount > 0 && errorCount > 0 && <span> • </span>}
                  {errorCount > 0 && <span className="text-red-600 font-medium">{errorCount} failed</span>}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {assets.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Assets ({assets.length})</h3>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading assets...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(asset => (
                <div key={asset.id} className="group bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="aspect-video bg-slate-200 flex items-center justify-center relative overflow-hidden">
                    {asset.file_type.startsWith('image/') && asset.public_url ? (
                      <img
                        src={asset.public_url}
                        alt={asset.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.file_type.startsWith('video/') ? (
                      <video
                        src={asset.public_url || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="w-8 h-8 text-slate-400" />
                    )}
                    <button
                      onClick={() => deleteAsset(asset.id, asset.storage_path)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{asset.file_name}</p>
                    <p className="text-xs text-slate-500">{(asset.file_size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(asset.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
