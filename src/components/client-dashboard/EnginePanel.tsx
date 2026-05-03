// Engine Panel — surfaces the new optimization engine's state for the
// operator. Lives next to the legacy BotControlModule sections so the
// existing UI keeps working while we migrate.

import { useEffect, useState } from 'react';
import { Loader2, Play, ShieldCheck, Activity, History, AlertTriangle } from 'lucide-react';
import {
  AgentAction,
  BotRun,
  botControlService,
  CampaignStateRow,
} from '../../lib/botControlService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserRole } from '../../lib/useUserRole';

const MODE_BADGE: Record<string, string> = {
  OPTIMIZE: 'bg-blue-50 text-blue-700 border-blue-200',
  SCALE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  HOLD:     'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_BADGE: Record<string, string> = {
  executed:    'bg-green-50 text-green-700 border-green-200',
  pending:     'bg-gray-50 text-gray-700 border-gray-200',
  rolled_back: 'bg-amber-50 text-amber-700 border-amber-200',
  failed:      'bg-red-50 text-red-700 border-red-200',
  skipped:     'bg-gray-50 text-gray-500 border-gray-200',
};

export default function EnginePanel() {
  const { user } = useAuth();
  const { isManagerOrAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | string>(null);
  const [runs, setRuns] = useState<BotRun[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [states, setStates] = useState<CampaignStateRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [runsRows, actionRows, stateRows] = await Promise.all([
        isManagerOrAdmin ? botControlService.fetchRecentRuns(50) : botControlService.fetchRecentRuns(15),
        botControlService.fetchAgentActions(isManagerOrAdmin ? undefined : user.id, 50),
        botControlService.fetchCampaignStates(isManagerOrAdmin ? undefined : user.id),
      ]);
      setRuns(runsRows); setActions(actionRows); setStates(stateRows);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [user?.id, isManagerOrAdmin]);

  const trigger = async (mode: 'DAILY_ROUTINE' | 'OPTIMIZE_CYCLE' | 'SCALE_CHECK', dryRun: boolean) => {
    setBusy(mode); setError(null);
    try {
      await botControlService.triggerOptimizationRun({ mode, dryRun });
      await reload();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setBusy(null); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const lastSuccessfulRun = runs.find(r => r.status === 'success' || r.status === 'partial');
  const errorCount = runs.slice(0, 10).reduce((s, r) => s + (r.errors ?? 0), 0);
  const totalActions = actions.length;
  const inDryRun = states.filter(s => s.dry_run).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Optimization Engine</h2>
          <p className="text-sm text-gray-500">
            Last run: {lastSuccessfulRun ? new Date(lastSuccessfulRun.started_at).toLocaleString() : '—'} ·{' '}
            {errorCount > 0 ? `${errorCount} errors in last 10 runs` : 'all good'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!!busy}
            onClick={() => trigger('DAILY_ROUTINE', true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {busy === 'DAILY_ROUTINE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Daily Routine (dry-run)
          </button>
          <button
            disabled={!!busy}
            onClick={() => trigger('OPTIMIZE_CYCLE', true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {busy === 'OPTIMIZE_CYCLE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Optimize Cycle (dry-run)
          </button>
          <button
            disabled={!!busy}
            onClick={() => trigger('SCALE_CHECK', true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {busy === 'SCALE_CHECK' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Pre-Scale Gate
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={<Activity className="w-4 h-4" />} label="Campaigns Enrolled" value={states.length} />
        <Stat icon={<History  className="w-4 h-4" />} label="Actions (last 50)"  value={totalActions} />
        <Stat icon={<ShieldCheck className="w-4 h-4" />} label="In Dry-Run"     value={inDryRun} />
        <Stat icon={<AlertTriangle className="w-4 h-4" />} label="Errors (last 10 runs)" value={errorCount} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Campaign States</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left py-2">Campaign</th>
                <th className="text-left py-2">Mode</th>
                <th className="text-left py-2">Target ROAS</th>
                <th className="text-left py-2">Last Optimized</th>
                <th className="text-left py-2">Dry-Run</th>
              </tr>
            </thead>
            <tbody>
              {states.slice(0, 20).map(s => (
                <tr key={`${s.user_id}-${s.campaign_id}`} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{s.campaign_id}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${MODE_BADGE[s.current_mode] ?? ''}`}>
                      {s.current_mode}
                    </span>
                  </td>
                  <td className="py-2">{s.target_roas?.toFixed(1) ?? '—'}</td>
                  <td className="py-2 text-gray-500">{s.last_optimized_at ? new Date(s.last_optimized_at).toLocaleString() : '—'}</td>
                  <td className="py-2">{s.dry_run ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {states.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No campaigns enrolled yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Recent Engine Decisions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Rule</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {actions.slice(0, 30).map(a => (
                <tr key={a.id} className="border-t border-gray-100 align-top">
                  <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="py-2 font-mono text-xs text-gray-700">{a.rule_id ?? '—'}</td>
                  <td className="py-2 font-medium text-gray-900">{a.action}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_BADGE[a.status] ?? ''}`}>
                      {a.status}{a.dry_run ? ' (dry)' : ''}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">{a.reason ?? '—'}</td>
                </tr>
              ))}
              {actions.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No engine actions yet. Trigger a dry-run above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
        {icon} {label}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
