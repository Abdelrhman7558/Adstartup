import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Bot, ShieldCheck, AlertCircle, History, Send, MessageSquare, Power, BrainCircuit, Activity, Scaling, Search } from 'lucide-react';
import { botControlService, OptimizationLog } from '../../lib/botControlService';
import { fetchDashboardData } from '../../lib/dashboardDataService';
import { MarketingCampaign } from '../../lib/marketingDashboardService';

export default function BotControlModule() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [logs, setLogs] = useState<OptimizationLog[]>([]);
  const [instruction, setInstruction] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState('');
  const [selectedActivityCampaign, setSelectedActivityCampaign] = useState<MarketingCampaign | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dashboardData, logData] = await Promise.all([
        fetchDashboardData(user.id),
        botControlService.fetchOptimizationLogs(user.id)
      ]);

      const liveCampaigns = [...(dashboardData.top_5_campaigns || []), ...(dashboardData.recent_campaigns || [])];
      
      // Filter for optimization enabled
      // Note: In a real app, we'd fetch directly from DB settings too
      setCampaigns(liveCampaigns as unknown as MarketingCampaign[]);
      setLogs(logData);
    } catch (error) {
      console.error('Error loading bot control data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInstruction = async () => {
    if (!user || !selectedCampaignId || !instruction) return;
    try {
      await botControlService.saveBotInstruction(user.id, selectedCampaignId, instruction);
      setInstruction('');
      alert('Instruction queued for the AI Bot.');
    } catch (e) {
        console.error(e);
    }
  };

  const handleNotifyClient = async () => {
      if (!user || !selectedCampaignId || !notifMessage) return;
      try {
          await botControlService.sendClientNotification(user.id, notifMessage);
          setNotifMessage('');
          alert('Notification sent to client.');
      } catch (e) {
          console.error(e);
      }
  };

  const handleToggleBot = async (campaignId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await botControlService.toggleOptimization(user.id, campaignId, !currentStatus);
      await loadData();
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  const activeOptimizing = campaigns.filter(c => c.optimization_enabled).length;
  const inTesting = logs.filter(l => l.bot_phase === 'testing').length; // Approximation
  const botHealth = logs.some(l => l.status === 'failed') ? 'Warning' : 'Healthy';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-2xl">
            <Bot className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-outfit">AI Optimizer Control Panel</h1>
            <p className="text-gray-500">Monitor and manage your Adstartup AI bot operations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
           <ShieldCheck className="w-5 h-5 text-green-600" />
           <span className="text-sm font-bold text-green-700">Bot Status: {botHealth}</span>
        </div>
      </div>

      {/* Section 1: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Managed Campaigns</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Testing Phase</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{inTesting}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active Optimization</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeOptimizing}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Scaling className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">Scaling Actions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {logs.filter(l => l.action_type === 'scale').length}
          </p>
        </div>
      </div>

      {/* Section 2: Campaign Detail Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
             <Search className="w-5 h-5 text-gray-400" />
             Managed Campaigns Detail
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-400">
              <tr>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Bot Phase</th>
                <th className="px-6 py-4 text-center">ROAS</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => {
                  const lastLog = logs.find(l => l.campaign_id === c.campaign_id);
                  return (
                    <tr 
                      key={c.campaign_id} 
                      onClick={() => setSelectedActivityCampaign(c)}
                      className="hover:bg-red-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{c.campaign_name}</div>
                        <div className="text-xs text-gray-400">{c.account_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          lastLog?.bot_phase === 'scaling' ? 'bg-purple-100 text-purple-700' :
                          lastLog?.bot_phase === 'testing' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {lastLog?.bot_phase || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">
                        {c.roas.toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${c.optimization_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${c.optimization_enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-[10px] font-bold">{c.optimization_enabled ? 'Running' : 'Stopped'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <button 
                            onClick={() => handleToggleBot(c.campaign_id, !!c.optimization_enabled)}
                            className={`p-2 rounded-xl transition-colors ${c.optimization_enabled ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}
                            title={c.optimization_enabled ? 'Stop Bot' : 'Start Bot'}
                         >
                            <Power className="w-5 h-5" />
                         </button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 3: Action Log */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
             <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               <History className="w-5 h-5 text-gray-400" />
               Bot Action Log
             </h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] p-6 space-y-4">
            {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No bot actions recorded yet.</div>
            ) : (
                logs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.action_type === 'scale' ? 'bg-purple-100 text-purple-700' :
                                log.action_type === 'pause' ? 'bg-red-100 text-red-700' :
                                log.action_type === 'skip' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {log.action_type}
                            </span>
                            <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{log.campaign_name}</div>
                        <div className="text-xs text-gray-600 mt-1">{log.reason}</div>
                        {log.action_detail && (
                            <div className="text-[10px] text-gray-400 mt-2 italic">{log.action_detail}</div>
                        )}
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Section 4: Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
               <Send className="w-5 h-5 text-gray-400" />
               Override Instructions
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Campaign</label>
                <select 
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                >
                    <option value="">Select a campaign...</option>
                    {campaigns.map(c => (
                        <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">AI Instruction</label>
                <textarea 
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. Increase budget by 10% or Keep running even if ROAS < 4"
                    className="w-full p-3 h-24 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm resize-none"
                />
              </div>
              <button 
                onClick={handleSendInstruction}
                disabled={!selectedCampaignId}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Analyze & Execute Instruction
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
               <MessageSquare className="w-5 h-5 text-gray-400" />
               Notify Client
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message</label>
                <textarea 
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Describe what the client needs to know..."
                    className="w-full p-3 h-24 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>
              <button 
                onClick={handleNotifyClient}
                disabled={!selectedCampaignId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send Notification
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Activity Detail Modal */}
      {selectedActivityCampaign && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 italic transition-all animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-red-100 rounded-xl">
                            <BrainCircuit className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedActivityCampaign.campaign_name}</h2>
                            <p className="text-xs text-gray-500">Bot Activity & Decision Timeline</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedActivityCampaign(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                    {/* Bot State Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current ROAS</span>
                            <span className="text-2xl font-bold text-gray-900">{selectedActivityCampaign.roas?.toFixed(2)}x</span>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                             <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bot Phase</span>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                 logs.find(l => l.campaign_id === selectedActivityCampaign.campaign_id)?.bot_phase === 'scaling' ? 'bg-purple-100 text-purple-700' :
                                 'bg-blue-100 text-blue-700'
                             }`}>
                                 {logs.find(l => l.campaign_id === selectedActivityCampaign.campaign_id)?.bot_phase || 'Active'}
                             </span>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                             <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Optimization</span>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedActivityCampaign.optimization_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                 {selectedActivityCampaign.optimization_enabled ? 'Running' : 'Stopped'}
                             </span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                             <History className="w-4 h-4 text-gray-400" />
                             Decision History
                        </h4>
                        <div className="space-y-3 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                            {logs.filter(l => l.campaign_id === selectedActivityCampaign.campaign_id).length === 0 ? (
                                <p className="text-sm text-gray-400 italic pl-8">No specific decisions logged for this campaign yet.</p>
                            ) : (
                                logs.filter(l => l.campaign_id === selectedActivityCampaign.campaign_id).map((log, idx) => (
                                    <div key={log.id} className="relative pl-10 group">
                                        <div className={`absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-4 ring-white z-10 ${
                                            log.status === 'failed' ? 'bg-red-500' : 
                                            log.action_type === 'scale' ? 'bg-purple-500' :
                                            log.action_type === 'pause' ? 'bg-red-500' :
                                            log.action_type === 'skip' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`} />
                                        
                                        <div className={`p-4 rounded-xl border ${
                                            idx === 0 ? 'bg-gray-50 border-blue-100 ring-2 ring-blue-50/50' : 'bg-white border-gray-100'
                                        }`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        log.action_type === 'scale' ? 'bg-purple-100 text-purple-700' :
                                                        log.action_type === 'pause' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {log.action_type}
                                                    </span>
                                                    {idx === 0 && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight anime-pulse">Latest</span>}
                                                </div>
                                                <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{log.reason || 'Routine Analysis'}</p>
                                            {log.action_detail && (
                                                <p className="text-xs text-gray-500 mt-1.5 border-t border-gray-50 pt-2 italic">{log.action_detail}</p>
                                            )}
                                            {log.status === 'failed' && (
                                                <div className="mt-3 flex items-center gap-2 p-2 bg-red-50/50 rounded-lg border border-red-100">
                                                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                                    <span className="text-[10px] font-bold text-red-700 uppercase">Error Detected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={() => setSelectedActivityCampaign(null)}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}

function X(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

