
import React, { useState, useEffect } from 'react';
import { IncentiveCampaign } from '../../types';
import { fetchIncentives, joinIncentiveCampaign } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const IncentivesPage: React.FC = () => {
    const [incentives, setIncentives] = useState<IncentiveCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinedCampaigns, setJoinedCampaigns] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchIncentives();
            const incentivesWithDates = data.map(inc => ({
                ...inc,
                startDate: new Date(inc.startDate),
                endDate: new Date(inc.endDate),
            }));
            setIncentives(incentivesWithDates);
            setLoading(false);
        };
        loadData();
    }, []);
    
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const handleJoinCampaign = async (campaignId: string) => {
        if (joinedCampaigns.has(campaignId)) return;

        // Optimistic UI Update
        setIncentives(prevIncentives =>
            prevIncentives.map(inc =>
                inc.id === campaignId
                    ? {
                        ...inc,
                        joinedAffiliates: inc.joinedAffiliates + 1,
                        status: (inc.joinedAffiliates + 1) >= inc.minAffiliates ? 'Active' : inc.status
                      }
                    : inc
            )
        );
        setJoinedCampaigns(prev => new Set(prev).add(campaignId));

        try {
            await joinIncentiveCampaign(campaignId);
        } catch (error) {
            console.error("Failed to join campaign:", error);
            // In a real app, you would revert the optimistic update here.
        }
    };

    if (loading) return <p className="p-4 text-center">Loading incentives...</p>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Incentive Programs</h2>

            {incentives.map(campaign => {
                const progress = Math.min((campaign.joinedAffiliates / campaign.minAffiliates) * 100, 100);
                const isJoined = joinedCampaigns.has(campaign.id);
                const isEnded = new Date() > campaign.endDate;

                return (
                    <Card key={campaign.id}>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.type === 'GMV Tiers' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
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
                            <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</p>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{campaign.description}</p>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                               <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Rules:</h4>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    {campaign.rules.map((rule, index) => <li key={index}>{rule}</li>)}
                                </ul>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            
                            <div className="mt-4">
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleJoinCampaign(campaign.id)}
                                    disabled={isJoined || isEnded}
                                    data-testid={`join-campaign-${campaign.id}`}
                                >
                                    {isEnded ? 'Campaign Ended' : isJoined ? 'Joined' : 'Join Campaign'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );
};

export default IncentivesPage;