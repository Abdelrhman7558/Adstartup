// Assets module — wraps the existing AssetUpload component plus a library
// view of every asset the user owns. Operator can upload new files OR pick
// from existing ones for any campaign creation flow.

import { useEffect, useState } from 'react';
import { UploadCloud, FolderOpen, Image as ImageIcon, Film, Trash2, Loader2 } from 'lucide-react';
import AssetUpload from '../../AssetUpload';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface UserAsset {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string | null;
  uploaded_at: string;
}

export default function AssetsModule() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_asset')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      if (!error && data) setAssets(data as UserAsset[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const removeAsset = async (a: UserAsset) => {
    if (!user?.id) return;
    if (!confirm(`Delete ${a.file_name}?`)) return;
    setDeleting(a.id);
    try {
      await supabase.storage.from('assets').remove([a.storage_path]);
      await supabase.from('users_asset').delete().eq('id', a.id).eq('user_id', user.id);
      await load();
    } finally { setDeleting(null); }
  };

  const filtered = assets.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'image') return a.file_type.startsWith('image/');
    if (filter === 'video') return a.file_type.startsWith('video/');
    return true;
  });

  const totalSize = assets.reduce((s, a) => s + (a.file_size || 0), 0);
  const fmtSize = (b: number) => b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-purple-100 rounded-2xl">
          <UploadCloud className="w-7 h-7 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets Library</h1>
          <p className="text-gray-500">Upload images and videos once, reuse them across any campaign.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={<FolderOpen className="w-4 h-4" />} label="Total Assets" value={assets.length} />
        <Stat icon={<ImageIcon className="w-4 h-4" />} label="Images" value={assets.filter(a => a.file_type.startsWith('image/')).length} />
        <Stat icon={<Film className="w-4 h-4" />} label="Videos" value={assets.filter(a => a.file_type.startsWith('video/')).length} />
        <Stat icon={<UploadCloud className="w-4 h-4" />} label="Total Size" value={fmtSize(totalSize)} />
      </div>

      {/* Upload zone (existing component, fully wired to Supabase Storage) */}
      <AssetUpload />

      {/* Library */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-900">Your Library</h3>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white">
            {(['all', 'image', 'video'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UploadCloud className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No assets yet. Upload your first file above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map(a => (
              <div key={a.id} className="group relative rounded-lg border border-gray-100 overflow-hidden hover:border-purple-300 transition-colors">
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  {a.file_type.startsWith('image/') && a.public_url ? (
                    <img src={a.public_url} alt={a.file_name} className="w-full h-full object-cover" loading="lazy" />
                  ) : a.file_type.startsWith('video/') && a.public_url ? (
                    <video src={a.public_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate" title={a.file_name}>{a.file_name}</p>
                  <p className="text-[10px] text-gray-500">{fmtSize(a.file_size)}</p>
                </div>
                <button
                  onClick={() => removeAsset(a)}
                  disabled={deleting === a.id}
                  title="Delete"
                  className="absolute top-1 right-1 p-1.5 rounded-md bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition disabled:opacity-50">
                  {deleting === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">{icon} {label}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
