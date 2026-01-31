import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Loader, User, FileText, Palette, Moon, Sun, Edit, Settings2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AccountsSettings from './AccountsSettings';

interface SettingsModalProps {
  onClose: () => void;
  onUpdate: (displayName: string) => void;
}

type Tab = 'account' | 'brief' | 'theme' | 'accounts';

export default function SettingsModal({ onClose, onUpdate }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Account settings
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Brief info
  const [hasBrief, setHasBrief] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      checkBrief();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || '');
    }
  };

  const checkBrief = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('client_briefs')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasBrief(!!data);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update display name
      if (displayName.trim()) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ display_name: displayName.trim() })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setSuccess('Account settings updated successfully');
      onUpdate(displayName.trim());
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update account settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBrief = () => {
    navigate('/brief');
    onClose();
  };

  const tabs = [
    { id: 'account' as Tab, label: 'Account', icon: User },
    { id: 'brief' as Tab, label: 'Brief', icon: FileText },
    { id: 'accounts' as Tab, label: 'Accounts', icon: Settings2 },
    { id: 'theme' as Tab, label: 'Theme', icon: Palette },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div
            className={`w-48 p-4 border-r ${
              theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Notifications */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Account Settings
                </h3>
                <form onSubmit={handleUpdateAccount} className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter your display name"
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      This name will appear in your dashboard header
                    </p>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    />
                  </div>

                  {/* Change Password */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <h4
                      className={`text-lg font-semibold mb-4 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      Change Password
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Enter new password"
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Confirm new password"
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Brief Tab */}
            {activeTab === 'brief' && (
              <div>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Brief Management
                </h3>
                <div
                  className={`p-6 rounded-xl border ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {hasBrief ? (
                    <>
                      <div className="flex items-start gap-4 mb-6">
                        <div
                          className={`p-3 rounded-xl ${
                            theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                          }`}
                        >
                          <FileText
                            className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                          />
                        </div>
                        <div>
                          <h4
                            className={`font-semibold mb-1 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            Client Brief Submitted
                          </h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            You have completed your client brief. You can edit and resubmit it at any time.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleEditBrief}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                      >
                        <Edit className="w-5 h-5" />
                        Edit Brief
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-8">
                        <FileText
                          className={`w-12 h-12 mx-auto mb-4 ${
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                          }`}
                        />
                        <h4
                          className={`font-semibold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          No Brief Submitted
                        </h4>
                        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Complete your client brief to help us understand your business better.
                        </p>
                        <button
                          onClick={handleEditBrief}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                          Submit Brief
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <div>
                <AccountsSettings />
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Theme Preferences
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={toggleTheme}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          theme === 'light' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <Sun
                          className={`w-6 h-6 ${theme === 'light' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                        />
                      </div>
                      <div className="text-left">
                        <h4
                          className={`font-semibold ${
                            theme === 'light' ? 'text-blue-900' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          Light Mode
                        </h4>
                        <p
                          className={`text-sm ${
                            theme === 'light' ? 'text-blue-700' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Clean and bright interface
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <Moon
                          className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
                        />
                      </div>
                      <div className="text-left">
                        <h4
                          className={`font-semibold ${
                            theme === 'dark' ? 'text-blue-200' : 'text-gray-900'
                          }`}
                        >
                          Dark Mode
                        </h4>
                        <p
                          className={`text-sm ${
                            theme === 'dark' ? 'text-blue-300' : 'text-gray-600'
                          }`}
                        >
                          Easier on the eyes in low light
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div
                  className={`mt-6 p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your theme preference is saved automatically and will be applied across your entire
                    dashboard experience.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
