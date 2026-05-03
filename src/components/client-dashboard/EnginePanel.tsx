// Engine Panel — surfaces the new optimization engine's state for the
// operator. Lives next to the legacy BotControlModule sections so the
// existing UI keeps working while we migrate.

import { useEffect, useState } from 'react';
import { Loader2, Play, ShieldCheck, Activity, History, AlertTriangle, Check, X, Send, MessageSquare, Plus } from 'lucide-react';
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
  const [pending, setPending] = useState<AgentAction[]>([]);
  const [states, setStates] = useState<CampaignStateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userScope = isManagerOrAdmin ? undefined : user.id;
      const [runsRows, actionRows, pendingRows, stateRows] = await Promise.all([
        botControlService.fetchRecentRuns(isManagerOrAdmin ? 50 : 15),
        botControlService.fetchAgentActions(userScope, 50),
        botControlService.fetchPendingActions(userScope),
        botControlService.fetchCampaignStates(userScope),
      ]);
      setRuns(runsRows); setActions(actionRows); setPending(pendingRows); setStates(stateRows);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    setBusy(`approve-${id}`); setError(null);
    try {
      const r = await botControlService.approveAction(id);
      if (!r.ok) setError(r.error ?? 'Action failed');
      await reload();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setBusy(null); }
  };

  const handleReject = async (id: string) => {
    setBusy(`reject-${id}`); setError(null);
    try {
      await botControlService.rejectAction(id);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setBusy(null); }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatLog(c => [...c, { role: 'user', text: msg }]);
    setChatInput(''); setChatSending(true);
    try {
      const r = await botControlService.chatWithAI(msg);
      setChatLog(c => [...c, { role: 'ai', text: r.reply || '(no reply)' }]);
      if (r.dispatched && r.dispatched.length) await reload();
    } catch (e: any) {
      setChatLog(c => [...c, { role: 'ai', text: `Error: ${e?.message ?? String(e)}` }]);
    } finally { setChatSending(false); }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Optimization Engine</h2>
          <p className="text-sm text-gray-500">
            Last run: {lastSuccessfulRun ? new Date(lastSuccessfulRun.started_at).toLocaleString() : '—'} ·{' '}
            {errorCount > 0 ? `${errorCount} errors in last 10 runs` : 'all good'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.dispatchEvent(new Event('openNewCampaignModal'))}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700">
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
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

      {/* Pending Approvals — actions Claude proposed but waiting on user OK */}
      <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Pending Approvals</h3>
            <p className="text-sm text-gray-500">Bot recommendations waiting for you to approve.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200">
            {pending.length} pending
          </span>
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No pending bot recommendations. Ask the AI in the chat below or trigger a run.</div>
        ) : (
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 bg-amber-50/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100">{p.rule_id ?? '—'}</span>
                    <span className="font-bold text-gray-900">{p.action}</span>
                    <span className="text-xs text-gray-500">on {p.campaign_id}</span>
                  </div>
                  {p.reason && <p className="text-sm text-gray-700 mt-1">{p.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={busy === `approve-${p.id}` || busy === `reject-${p.id}`}
                    onClick={() => handleApprove(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {busy === `approve-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    disabled={busy === `approve-${p.id}` || busy === `reject-${p.id}`}
                    onClick={() => handleReject(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                    {busy === `reject-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Chat — talk to Claude, ask it to propose actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <button
          className="flex items-center gap-2 font-bold text-gray-900 mb-2"
          onClick={() => setChatOpen(o => !o)}>
          <MessageSquare className="w-5 h-5" /> Ask the AI Media Buyer
          <span className="text-xs text-gray-500 font-normal">({chatOpen ? 'hide' : 'show'})</span>
        </button>
        {chatOpen && (
          <>
            <div className="space-y-2 max-h-72 overflow-y-auto mb-3 p-3 bg-gray-50 rounded-lg">
              {chatLog.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  Ask things like: "اعمل حملة جديدة عشان منتج X" أو "شوف حملاتي وقولي إيه اللي محتاج يتظبط"
                </p>
              )}
              {chatLog.map((m, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-white border mr-8'}`}>
                  <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleChatSend(); }}
                placeholder="اكتب سؤالك..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <button
                disabled={chatSending || !chatInput.trim()}
                onClick={handleChatSend}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50">
                {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </>
        )}
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
