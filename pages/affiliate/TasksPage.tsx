import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, SampleRequest } from '../../types';
import { listenToSampleRequestsForAffiliate, fetchCampaignById, affiliateConfirmsShowcase, listenToCampaigns } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Task extends SampleRequest {
    campaign?: Campaign;
}

const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
    const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map());
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const unsubCampaigns = listenToCampaigns((campaignData) => {
            setCampaigns(new Map(campaignData.map(c => [c.id, c])));
        });
        
        const unsubRequests = listenToSampleRequestsForAffiliate(user.uid, (requests) => {
            setAllRequests(requests);
            setLoading(false);
        });

        return () => {
            unsubCampaigns();
            unsubRequests();
        };
    }, [user]);

    const tasks: Task[] = useMemo(() => {
        return allRequests
            .filter(req => req.status === 'PendingShowcase')
            .map(req => ({
                ...req,
                campaign: campaigns.get(req.campaignId),
            }))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [allRequests, campaigns]);


    const handleConfirmShowcase = async (task: Task) => {
        if (!task.campaign?.shareLink || confirming) return;
        
        setConfirming(task.id);
        window.open(task.campaign.shareLink, '_blank');
        try {
            await affiliateConfirmsShowcase(task.id);
            // The listener will automatically remove the task from the list
        } catch (error) {
            console.error("Failed to confirm showcase add:", error);
            alert("There was an issue confirming your action. Please try again.");
        } finally {
            setConfirming(null);
        }
    };

    if (loading) {
        return <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading your tasks...</p>;
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Tasks</h2>
            
            {tasks.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-10">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Caught Up!</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You have no pending tasks. Check the Campaigns tab to request new samples.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <Card key={task.id}>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <img 
                                        src={task.campaign?.imageUrl} 
                                        alt={task.campaign?.name} 
                                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0" 
                                    />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-green-600 dark:text-green-400">ADMIN APPROVED</p>
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{task.campaign?.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Next step: Add this product to your showcase.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full mt-4"
                                    onClick={() => handleConfirmShowcase(task)}
                                    disabled={confirming === task.id}
                                    data-testid={`confirm-task-${task.id}`}
                                >
                                    {confirming === task.id ? 'Confirming...' : 'Add to Showcase & Confirm'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TasksPage;