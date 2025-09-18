import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, SampleRequest } from '../../types';
import { listenToSampleRequestsForAffiliate, fetchCampaignById, affiliateConfirmsShowcase, listenToCampaigns } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CheckCircleIcon } from '../../components/icons/Icons';
import OnboardingGuide from '../../components/affiliate/OnboardingGuide';
import WeeklyReminderCard from '../../components/affiliate/WeeklyReminderCard';
import WeeklySurveyModal from '../../components/affiliate/WeeklySurveyModal';

interface Task extends SampleRequest {
    campaign?: Campaign;
}

const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
    const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map());
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

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
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }, [allRequests, campaigns]);
    
    const feedbackRequestTask = useMemo(() => {
        if (user?.feedbackRequest) {
            const expiresAt = user.feedbackRequest.expiresAt;
            // The listener updates user, so we check against a new Date object.
            if (new Date() < new Date(expiresAt)) {
                return user.feedbackRequest;
            }
        }
        return null;
    }, [user]);


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

    const showOnboarding = user?.onboardingStatus && user.onboardingStatus !== 'completed';

    return (
        <div className="p-4 space-y-4">
            {isSurveyModalOpen && feedbackRequestTask && (
                <WeeklySurveyModal
                    onClose={() => setIsSurveyModalOpen(false)}
                    customPrompt={feedbackRequestTask.prompt}
                    isManualRequest={true}
                />
            )}
            
            {feedbackRequestTask && (
                 <Card className="border-2 border-primary-500 animate-pulse-slow">
                    <CardContent>
                        <h2 className="text-sm font-bold uppercase text-primary-600 dark:text-primary-400 tracking-wider">Feedback Requested</h2>
                        <p className="text-gray-800 dark:text-gray-200 mt-2">{feedbackRequestTask.prompt}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">This request expires on {new Date(feedbackRequestTask.expiresAt).toLocaleDateString()}.</p>
                        <Button className="w-full mt-4" onClick={() => setIsSurveyModalOpen(true)}>Share Your Feedback</Button>
                    </CardContent>
                </Card>
            )}

            {showOnboarding ? <OnboardingGuide /> : <WeeklyReminderCard />}

            {!showOnboarding && (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Tasks</h2>
                
                {tasks.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-10 flex flex-col items-center">
                            <CheckCircleIcon className="h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">All Caught Up!</h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You have no pending tasks. Check the Campaigns tab to request new samples.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <Card key={task.id}>
                                <CardContent>
                                    <div className="flex items-start gap-4">
                                        <img 
                                            src={task.campaign?.imageUrl} 
                                            alt={task.campaign?.name} 
                                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0" 
                                        />
                                        <div className="flex-1">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-soft-peach text-red-800">
                                                Approved
                                            </span>
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mt-1">{task.campaign?.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Your sample request was approved! Please add this product to your showcase to continue.
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
              </>
            )}
        </div>
    );
};

export default TasksPage;