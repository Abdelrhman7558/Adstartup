import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Loader, FileText, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ClientBriefData {
  business_name: string;
  industry: string;
  target_audience: string;
  campaign_objective: string;
  budget: number;
  duration: string;
  product_description: string;
  usp: string;
  competitors: string;
  brand_guidelines: string;
  ad_tone: string;
  preferred_platforms: string;
}

export default function EditBriefModal({ isOpen, onClose, onSuccess }: EditBriefModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientBriefData>({
    business_name: '',
    industry: '',
    target_audience: '',
    campaign_objective: '',
    budget: 0,
    duration: '',
    product_description: '',
    usp: '',
    competitors: '',
    brand_guidelines: '',
    ad_tone: '',
    preferred_platforms: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      loadBrief();
    }
  }, [isOpen, user]);

  const loadBrief = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('client_briefs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setFormData({
          business_name: data.business_name || '',
          industry: data.industry || '',
          target_audience: data.target_audience || '',
          campaign_objective: data.campaign_objective || '',
          budget: data.budget || 0,
          duration: data.duration || '',
          product_description: data.product_description || '',
          usp: data.usp || '',
          competitors: data.competitors || '',
          brand_guidelines: data.brand_guidelines || '',
          ad_tone: data.ad_tone || '',
          preferred_platforms: data.preferred_platforms || ''
        });
      }
    } catch (err: any) {
      console.error('Error loading brief:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: saveError } = await supabase
        .from('client_briefs')
        .upsert({
          user_id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        })
        .select();

      if (saveError) throw saveError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving brief:', err);
      setError('Failed to save brief changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ClientBriefData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl`}
      >
        <button
          onClick={onClose}
          disabled={isSaving}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isSaving
            ? 'cursor-not-allowed opacity-50'
            : theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
            }`}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Edit Your Brief
            </h2>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your business details and campaign preferences.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Business Name */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Industry */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Campaign Objective */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  What is your main Campaign Objective? (e.g., Sales, Leads, Awareness)
                </label>
                <input
                  type="text"
                  value={formData.campaign_objective}
                  onChange={(e) => handleChange('campaign_objective', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Target Audience */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Who is your Target Audience? (Demographics, interests, etc.)
                </label>
                <textarea
                  value={formData.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Product Description */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Describe your Product/Service
                </label>
                <textarea
                  value={formData.product_description}
                  onChange={(e) => handleChange('product_description', e.target.value)}
                  disabled={isSaving}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* USP */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Unique Selling Points (What makes you different?)
                </label>
                <textarea
                  value={formData.usp}
                  onChange={(e) => handleChange('usp', e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Competitors */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Main Competitors
                </label>
                <textarea
                  value={formData.competitors}
                  onChange={(e) => handleChange('competitors', e.target.value)}
                  disabled={isSaving}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Budget & Duration */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Total Budget ($)
                </label>
                <input
                  type="number"
                  value={formData.budget || 0}
                  onChange={(e) => handleChange('budget', parseFloat(e.target.value))}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Duration (e.g. 30 days)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Tone & Platforms */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Preferred Ad Tone (e.g. Professional, Friendly)
                </label>
                <input
                  type="text"
                  value={formData.ad_tone}
                  onChange={(e) => handleChange('ad_tone', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Preferred Platforms (e.g. Facebook, Instagram)
                </label>
                <input
                  type="text"
                  value={formData.preferred_platforms}
                  onChange={(e) => handleChange('preferred_platforms', e.target.value)}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${isSaving
                  ? 'cursor-not-allowed opacity-50'
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${isSaving
                  ? 'bg-blue-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isSaving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Brief
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

