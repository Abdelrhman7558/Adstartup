import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, User, Mail, Lock, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ConnectMetaButton from '../../ConnectMetaButton';
import { useIntegrationAgent } from '../../../lib/agents/IntegrationAgent';

export default function SettingsModule() {
    const { user, profile, refreshUserState } = useAuth();
    const { data: metaConnection } = useIntegrationAgent();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile picture
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Name fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Email
    const [email, setEmail] = useState('');

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // State
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Load initial data
    useEffect(() => {
        if (profile?.full_name) {
            const parts = profile.full_name.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
        if (user?.email) {
            setEmail(user.email);
        }
        // Load avatar
        loadAvatar();
    }, [profile, user]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const loadAvatar = async () => {
        if (!user?.id) return;
        try {
            const { data } = await supabase.storage
                .from('avatars')
                .getPublicUrl(`${user.id}/avatar`);
            // Check if file actually exists by fetching it
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) {
                setAvatarUrl(data.publicUrl + '?t=' + Date.now());
            }
        } catch {
            // No avatar uploaded yet
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        if (file.size > 2 * 1024 * 1024) {
            setToast({ type: 'error', message: 'Image must be smaller than 2MB' });
            return;
        }

        setAvatarUploading(true);
        try {
            const filePath = `${user.id}/avatar`;
            const { error } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (error) throw error;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl + '?t=' + Date.now());
            setToast({ type: 'success', message: 'Profile picture updated!' });
        } catch (err: any) {
            console.error('Avatar upload error:', err);
            setToast({ type: 'error', message: err.message || 'Failed to upload image' });
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!user?.id) return;
        setAvatarUploading(true);
        try {
            await supabase.storage
                .from('avatars')
                .remove([`${user.id}/avatar`]);
            setAvatarUrl(null);
            setToast({ type: 'success', message: 'Profile picture removed' });
        } catch (err: any) {
            setToast({ type: 'error', message: 'Failed to remove picture' });
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            // If email changed
            if (email !== user.email) {
                const { error: emailError } = await supabase.auth.updateUser({ email });
                if (emailError) throw emailError;
            }

            await refreshUserState();
            setToast({ type: 'success', message: 'Profile saved successfully!' });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword) {
            setToast({ type: 'error', message: 'Please enter a new password' });
            return;
        }
        if (newPassword.length < 6) {
            setToast({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setCurrentPassword('');
            setNewPassword('');
            setToast({ type: 'success', message: 'Password changed successfully!' });
        } catch (err: any) {
            setToast({ type: 'error', message: err.message || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    const initials = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account information and preferences.</p>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all animate-fade-in ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {toast.message}
                </div>
            )}

            {/* Profile Picture */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile Picture</h2>
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-400">{initials}</span>
                            )}
                        </div>
                        {avatarUploading && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-gray-900">Profile picture</p>
                        <p className="text-xs text-gray-500">PNG, JPEG under 2MB</p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                                Upload new picture
                            </button>
                            {avatarUrl && (
                                <button
                                    onClick={handleDeleteAvatar}
                                    disabled={avatarUploading}
                                    className="px-4 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Full Name */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    <User className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Full Name
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">First name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                            placeholder="First name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Last name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                            placeholder="Last name"
                        />
                    </div>
                </div>
            </div>

            {/* Contact Email */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Contact Email
                </h2>
                <p className="text-xs text-gray-400 mb-4">Manage your account's email address for notifications.</p>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Password
                </h2>
                <p className="text-xs text-gray-400 mb-4">Modify your current password.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Current password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">New password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleChangePassword}
                        disabled={saving || !newPassword}
                        className="px-5 py-2 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 text-sm"
                    >
                        Change Password
                    </button>
                </div>
            </div>

            {/* Integrated Accounts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Integrated Accounts
                </h2>
                <p className="text-xs text-gray-400 mb-4">Manage your connected platform accounts.</p>

                {/* Meta integration */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-600">f</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Meta Ads</p>
                            <p className="text-xs text-gray-500">
                                {metaConnection?.isConnected
                                    ? `Connected — ${metaConnection.adAccountName || 'Active'}`
                                    : 'Not connected'}
                            </p>
                        </div>
                    </div>
                    <ConnectMetaButton
                        userId={user?.id}
                        isConnected={!!metaConnection?.isConnected}
                        variant="button"
                    />
                </div>

                {/* Google Analytics placeholder */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mt-3 opacity-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-400">G</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700 text-sm">Google Analytics</p>
                            <p className="text-xs text-gray-400">Coming Soon</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-200 rounded-lg">Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
