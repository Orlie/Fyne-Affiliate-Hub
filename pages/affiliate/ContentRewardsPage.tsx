import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ContentReward, ContentSubmission, ContentSubmissionStatus } from '../../types';
import { listenToContentRewards, listenToSubmissionsForAffiliate, resubmitContentForReward, markSubmissionsAsViewed } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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

    // Effect to clear notifications when 'submissions' tab is viewed
    useEffect(() => {
        if (activeTab === 'submissions' && submissions.length > 0) {
            const unreadIds = submissions.filter(s => !s.isViewedByAffiliate).map(s => s.id);
            if (unreadIds.length > 0) {
                markSubmissionsAsViewed(unreadIds);
            }
        }
    }, [activeTab, submissions]);

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
    const [filter, setFilter] = useState<ContentSubmissionStatus | 'all'>('all');
    const [submissionToResubmit, setSubmissionToResubmit] = useState<ContentSubmission | null>(null);

    const performanceStats = useMemo(() => {
        const approved = submissions.filter(s => s.status === 'approved');
        const totalEarnings = approved.reduce((sum, s) => sum + (s.payoutAmount || 0), 0);
        const totalReviewed = submissions.filter(s => s.status === 'approved' || s.status === 'rejected').length;
        const approvalRate = totalReviewed > 0 ? (approved.length / totalReviewed) * 100 : 0;
        return {
            totalEarnings,
            approvedCount: approved.length,
            approvalRate
        };
    }, [submissions]);

    const filteredSubmissions = useMemo(() => {
        return submissions
            .filter(s => s.status !== 'resubmitted')
            .filter(s => filter === 'all' || s.status === filter);
    }, [submissions, filter]);

    const getStatusBadgeColor = (status: ContentSubmission['status']) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 text-center">
                    <div>
                        <p className="text-lg font-bold">${performanceStats.totalEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total Earnings</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{performanceStats.approvedCount}</p>
                        <p className="text-xs text-gray-500">Approved</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold">{performanceStats.approvalRate.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Approval Rate</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'pending_review', 'approved', 'rejected'] as const).map(f => (
                    <Button key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)} className="whitespace-nowrap">
                        {f.replace('_', ' ').replace('all', 'All').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                ))}
            </div>

            {filteredSubmissions.length === 0 ? (
                <p className="text-center text-gray-500 pt-8">No submissions match this filter.</p>
            ) : (
                <div className="space-y-3">
                    {filteredSubmissions.map(sub => {
                        const reward = rewards.find(r => r.id === sub.rewardId);
                        return (
                            <Card key={sub.id} className={!sub.isViewedByAffiliate ? 'border-2 border-primary-500' : ''}>
                                <CardContent>
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{reward?.title || 'Unknown Reward'}</p>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(sub.status)}`}>
                                            {sub.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <p><strong>Submitted:</strong> {sub.submittedAt.toLocaleDateString()}</p>
                                        {sub.reviewedAt && <p><strong>Reviewed:</strong> {sub.reviewedAt.toLocaleDateString()}</p>}
                                    </div>
                                     <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                        <p><strong>Video URL:</strong> <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">Link</a></p>
                                        <p><strong>Ad Code:</strong> <span className="font-mono">{sub.adCode}</span></p>
                                        {sub.status === 'approved' && <p><strong>Payout:</strong> <span className="font-bold text-green-600">${sub.payoutAmount?.toFixed(2)}</span> ({sub.trackedViews?.toLocaleString()} views)</p>}
                                        {sub.status === 'rejected' && <p><strong>Reason:</strong> {sub.rejectionReason}</p>}
                                    </div>
                                    {sub.status === 'rejected' && (
                                        <div className="mt-3">
                                            <Button size="sm" className="w-full" onClick={() => setSubmissionToResubmit(sub)}>Resubmit</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {submissionToResubmit && (
                <ResubmissionModal
                    submission={submissionToResubmit}
                    onClose={() => setSubmissionToResubmit(null)}
                />
            )}
        </div>
    );
};

interface ResubmissionModalProps {
    submission: ContentSubmission;
    onClose: () => void;
}
const ResubmissionModal: React.FC<ResubmissionModalProps> = ({ submission, onClose }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [adCode, setAdCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!videoUrl || !adCode) {
            setError('Please provide both a new video URL and ad code.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        await resubmitContentForReward(submission, { videoUrl, adCode });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent>
                    <h2 className="text-xl font-bold">Resubmit Video</h2>
                    <div className="mt-2 p-2 border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Rejection Reason:</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{submission.rejectionReason}</p>
                    </div>
                    <div className="mt-4 space-y-4">
                        <Input label="New Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/..." />
                        <Input label="New Ad Code" value={adCode} onChange={e => setAdCode(e.target.value)} placeholder="FYNE..." />
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ContentRewardsPage;