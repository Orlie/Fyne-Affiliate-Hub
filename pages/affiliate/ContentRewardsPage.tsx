
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ContentReward, ContentSubmission } from '../../types';
import { listenToContentRewards, listenToSubmissionsForAffiliate } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';

type Tab = 'discover' | 'submissions';

const ContentRewardsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('discover');
    const [rewards, setRewards] = useState<ContentReward[]>([]);
    const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const unsubRewards = listenToContentRewards(data => {
            setRewards(data.filter(r => r.status === 'active' || r.status === 'completed'));
            if(loading) setLoading(false);
        });
        const unsubSubmissions = listenToSubmissionsForAffiliate(user.uid, setSubmissions);
        return () => {
            unsubRewards();
            unsubSubmissions();
        };
    }, [user]);

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Content Rewards</h2>
            
            <div className="flex space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <button onClick={() => setActiveTab('discover')} className={`flex-1 py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${activeTab === 'discover' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                    Discover
                </button>
                <button onClick={() => setActiveTab('submissions')} className={`flex-1 py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${activeTab === 'submissions' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                    My Submissions
                </button>
            </div>
            
            {loading ? <p className="text-center">Loading...</p> : (
                activeTab === 'discover' 
                    ? <DiscoverView rewards={rewards} /> 
                    : <SubmissionsView submissions={submissions} rewards={rewards} />
            )}
        </div>
    );
};

const DiscoverView: React.FC<{rewards: ContentReward[]}> = ({ rewards }) => {
    return (
        <div className="space-y-4">
            {rewards.map(reward => {
                const progress = Math.min((reward.paidOut / reward.totalBudget) * 100, 100);
                return (
                    <Link to={`/reward-detail/${reward.id}`} key={reward.id}>
                        <Card>
                            <img src={reward.imageUrl} alt={reward.title} className="h-40 w-full object-cover" />
                            <CardContent>
                                <h3 className="font-bold text-gray-900 dark:text-white">{reward.title}</h3>
                                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                                    ${reward.rewardValue.toFixed(2)} {reward.rewardUnit}
                                </p>
                                <div className="mt-3">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            ${reward.paidOut.toLocaleString()} / ${reward.totalBudget.toLocaleString()} paid out
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
};

const SubmissionsView: React.FC<{submissions: ContentSubmission[], rewards: ContentReward[]}> = ({ submissions, rewards }) => {
     if (submissions.length === 0) {
        return <p className="text-center text-gray-500 pt-8">You haven't made any submissions yet.</p>;
    }
    const getStatusBadgeColor = (status: ContentSubmission['status']) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        }
    }
    return (
        <div className="space-y-3">
            {submissions.map(sub => {
                const reward = rewards.find(r => r.id === sub.rewardId);
                return (
                    <Card key={sub.id}>
                        <CardContent>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{reward?.title || 'Unknown Reward'}</p>
                                    <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline break-all">View Submission</a>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(sub.status)}`}>
                                    {sub.status.replace('_', ' ')}
                                </span>
                            </div>
                             <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <p><strong>Submitted:</strong> {sub.submittedAt.toLocaleDateString()}</p>
                                {sub.status === 'approved' && <p><strong>Payout:</strong> <span className="font-bold text-green-600">${sub.payoutAmount?.toFixed(2)}</span> ({sub.trackedViews?.toLocaleString()} views)</p>}
                                {sub.status === 'rejected' && <p><strong>Reason:</strong> {sub.rejectionReason}</p>}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default ContentRewardsPage;
