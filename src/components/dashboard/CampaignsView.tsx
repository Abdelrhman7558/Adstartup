import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Plus, Folder, Calendar, TrendingUp, Loader, X, AlertCircle } from 'lucide-react';
import { getUserCampaigns, Campaign, deleteCampaign } from '../../lib/campaignService';
import CampaignWizard from './CampaignWizard';

export default function CampaignsView() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;

    setIsLoading(true);
    const data = await getUserCampaigns(user.id);
    setCampaigns(data.filter(c => c.status !== 'draft'));
    setIsLoading(false);
  };

  const handleCampaignCreated = () => {
    loadCampaigns();
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!user) return;

    setDeletingId(campaignId);
    setError(null);

    const { error: deleteError } = await deleteCampaign(user.id, campaignId, campaignName);

    if (deleteError) {
      setError('Failed to delete campaign');
      setDeletingId(null);
      return;
    }

    setSuccess(`Campaign "${campaignName}" deleted successfully`);
    setDeletingId(null);
    await loadCampaigns();

    setTimeout(() => setSuccess(null), 5000);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

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
              Campaigns
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Folder className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              No campaigns yet
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first campaign to get started
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 rounded-xl font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`rounded-xl p-5 transition-all relative group ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'}`}>
                      <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {campaign.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                    disabled={deletingId === campaign.id}
                    className={`ml-2 p-1.5 rounded-lg transition-all flex-shrink-0 ${
                      deletingId === campaign.id
                        ? 'cursor-not-allowed opacity-50'
                        : theme === 'dark'
                        ? 'bg-gray-600 hover:bg-red-600 text-gray-300 hover:text-white'
                        : 'bg-white hover:bg-red-100 text-gray-600 hover:text-red-600'
                    }`}
                    title="Delete campaign"
                  >
                    {deletingId === campaign.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                    </span>
                  </div>

                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    Created {formatDate(campaign.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CampaignWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCampaignCreated}
      />
    </div>
  );
}
