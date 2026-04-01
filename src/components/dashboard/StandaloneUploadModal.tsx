import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Upload, Loader, AlertCircle } from 'lucide-react';
import { uploadStandaloneAssets } from '../../lib/campaignService';

interface StandaloneUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StandaloneUploadModal({ isOpen, onClose, onSuccess }: StandaloneUploadModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!(file instanceof File)) return false;
      if (file.size === 0) return false;
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { successCount, totalFiles, errors } = await uploadStandaloneAssets(
        user.id,
        selectedFiles,
        (current, total) => {
          setUploadProgress(Math.round((current / total) * 100));
        }
      );

      if (successCount > 0) {
        onSuccess();
        handleClose();
      } else {
        setError(`Failed to upload files: ${errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-2xl`}
      >
        <button
          onClick={handleClose}
          disabled={isUploading}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isUploading
              ? 'cursor-not-allowed opacity-50'
              : theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Upload Assets
        </h2>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Upload files without linking them to a campaign
        </p>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Select Files *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full py-4 border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2 ${
                isUploading
                  ? 'cursor-not-allowed opacity-50'
                  : theme === 'dark'
                  ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Click to upload files</span>
            </button>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                </p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {file.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        className={`ml-2 p-1 rounded-lg transition-colors ${
                          isUploading
                            ? 'cursor-not-allowed opacity-50'
                            : theme === 'dark'
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Uploading files...
                </span>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  {uploadProgress}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                isUploading
                  ? 'cursor-not-allowed opacity-50'
                  : theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                isUploading || selectedFiles.length === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Files'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
