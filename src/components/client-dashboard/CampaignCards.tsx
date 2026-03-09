import React, { useState } from 'react';
import { NormalizedCampaign } from '../../lib/agents/CampaignAgent';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { MoreVertical, Edit2, PauseCircle, PlayCircle } from 'lucide-react';

interface CampaignCardsProps {
    campaigns: NormalizedCampaign[];
}

export function CampaignCards({ campaigns }: CampaignCardsProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleAction = (action: string, campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`${action} triggered for campaign ${campaignId}`);
        setOpenMenuId(null);
    };

    if (campaigns.length === 0) {
        return (
            <div className="h-48 w-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                <p>No campaigns found.</p>
                <p className="text-sm mt-1">Create one to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-gray-100 rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold ${campaign.platform === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' : 'bg-blue-600'
                                    }`}
                            >
                                {campaign.platform === 'instagram' ? 'Ig' : 'Fb'}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm capitalize">
                                {campaign.platform}
                            </span>
                            <StatusBadge variant={campaign.status === 'active' ? 'active' : 'draft'} className="ml-1 uppercase text-[10px] px-2">
                                {campaign.status}
                            </StatusBadge>
                        </div>
                        <div className="relative">
                            <button
                                onClick={(e) => toggleMenu(campaign.id, e)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Action Dropdown */}
                            {openMenuId === campaign.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={(e) => handleAction('Edit', campaign.id, e)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Campaign
                                    </button>
                                    <button
                                        onClick={(e) => handleAction('Pause', campaign.id, e)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors"
                                    >
                                        <PauseCircle className="w-4 h-4" /> Pause
                                    </button>
                                    <button
                                        onClick={(e) => handleAction('Activate', campaign.id, e)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                    >
                                        <PlayCircle className="w-4 h-4" /> Activate
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 flex flex-col items-center">
                        <div className="w-full text-left mb-6">
                            <h3 className="font-bold text-gray-900 tracking-tight text-base">{campaign.name}</h3>
                        </div>

                        {/* Phone Mockup Frame */}
                        <div className="relative w-48 h-[280px] bg-black rounded-[32px] p-2 shadow-xl shrink-0 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                            <div className="absolute top-0 inset-x-0 h-6 bg-black z-10 flex justify-center">
                                <div className="w-16 h-4 bg-black rounded-b-xl absolute top-0"></div>
                            </div>
                            <img
                                src={campaign.thumbnail}
                                alt={campaign.name}
                                className="w-full h-full object-cover rounded-[24px]"
                            />

                            {/* Overlay Mock UI for specific designs */}
                            <div className="absolute bottom-4 inset-x-4 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                <div className="text-white text-[10px] font-semibold truncate leading-tight">
                                    {campaign.name.split('-')[0]}
                                </div>
                                <div className="text-white/60 text-[8px] mt-0.5 truncate">Sponsored</div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            ))}
            {openMenuId && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setOpenMenuId(null)}
                />
            )}
        </div>
    );
}
