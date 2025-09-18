

import React, { useState, useEffect } from 'react';
import { IncentiveCampaign } from '../../types';
import { listenToIncentives, joinIncentiveCampaign } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ChevronDownIcon } from '../../components/icons/Icons';

const IncentivesPage: React.FC = () => {
    const [incentives, setIncentives] = useState<IncentiveCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinedCampaigns, setJoinedCampaigns] = useState<Set<string>>(new Set());
    const [expandedIncentiveId, setExpandedIncentiveId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToIncentives((data) => {
            setIncentives(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const handleJoinCampaign = async (campaignId: string) => {
        if (joinedCampaigns.has(campaignId)) return;

        setJoinedCampaigns(prev => new Set(prev).add(campaignId));

        try {
            await joinIncentiveCampaign(campaignId);
        } catch (error) {
            console.error("Failed to join campaign:", error);
            alert("There was an error joining the campaign. Please try again.");
            setJoinedCampaigns(prev => {
                const newSet = new Set(prev);
                newSet.delete(campaignId);
                return newSet;
            });
        }
    };

    const handleToggle = (incentiveId: string) => {
        setExpandedIncentiveId(prevId => (prevId === incentiveId ? null : incentiveId));
    };

    if (loading) return <p className="p-4 text-center">Loading incentives...</p>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Incentive Programs</h2>

            {incentives.map(campaign => {
                const isExpanded = expandedIncentiveId === campaign.id;
                const progress = Math.min((campaign.joinedAffiliates / campaign.minAffiliates) * 100, 100);
                const isJoined = joinedCampaigns.has(campaign.id);
                const isEnded = new Date() > campaign.endDate;

                return (
                    <Card key={campaign.id}>
                        <div className="cursor-pointer" onClick={() => handleToggle(campaign.id)}>
                            <CardContent>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2 items-center mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.type === 'GMV Tiers' ? 'bg-soft-peach text-red-800' : 'bg-soft-pink text-pink-800'}`}>
                                                {campaign.type}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                isEnded ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                                campaign.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            }`}>
                                                {isEnded ? 'Ended' : campaign.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</p>
                                    </div>
                                    <ChevronDownIcon className={`h-6 w-6 text-gray-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </CardContent>
                        </div>

                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                            <div className="px-4 md:px-6 pb-4 space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 pt-2">{campaign.description}</p>
                                
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                   <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Rules:</h4>
                                    <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        {campaign.rules.map((rule, index) => <li key={index}>{rule}</li>)}
                                    </ul>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Activation Progress:</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                                                style={{ width: `${progress}%` }}
                                                data-testid={`progress-bar-${campaign.id}`}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {campaign.joinedAffiliates} / {campaign.minAffiliates}
                                        </span>
                                    </div>
                                    <p className="text-xs text-center mt-1 text-gray-500">
                                        {campaign.status === 'Pending' ? 'Campaign activates when goal is met.' : 'Campaign is active!'}
                                    </p>
                                </div>
                                
                                <div className="pt-4">
                                    <Button 
                                        className="w-full" 
                                        onClick={(e) => { e.stopPropagation(); handleJoinCampaign(campaign.id); }}
                                        disabled={isJoined || isEnded}
                                        data-testid={`join-campaign-${campaign.id}`}
                                    >
                                        {isEnded ? 'Campaign Ended' : isJoined ? 'Joined' : 'Join Campaign'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    );
};

export default IncentivesPage;
