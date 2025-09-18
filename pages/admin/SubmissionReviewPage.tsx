import React, { useState, useEffect } from 'react';
import { ContentReward, ContentSubmission } from '../../types';
import { listenToSubmissionsForReward, reviewSubmission } from '../../services/mockApi';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { ChevronLeftIcon } from '../../components/icons/Icons';

interface SubmissionReviewPageProps {
    reward: ContentReward;
    onBack: () => void;
}

const SubmissionReviewPage: React.FC<SubmissionReviewPageProps> = ({ reward, onBack }) => {
    const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState<ContentSubmission | null>(null);
    const [trackedViews, setTrackedViews] = useState(0);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToSubmissionsForReward(reward.id, data => {
            setSubmissions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [reward.id]);

    const handleReview = async (decision: 'approved' | 'rejected') => {
        if (!reviewing) return;
        
        if (decision === 'approved' && trackedViews <= 0) {
            alert("Please enter a valid number of views.");
            return;
        }
        
        await reviewSubmission(reviewing.id, decision, {
            trackedViews: decision === 'approved' ? trackedViews : undefined,
            rejectionReason: decision === 'rejected' ? rejectionReason : undefined,
        });

        // Reset and close
        setReviewing(null);
        setTrackedViews(0);
        setRejectionReason('');
    };

    const pendingSubmissions = submissions.filter(s => s.status === 'pending_review');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                Back to All Rewards
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Submissions</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">For: <span className="font-semibold">{reward.title}</span></p>

            <div className="mt-8">
                {loading ? <p>Loading submissions...</p> : (
                    pendingSubmissions.length === 0 ? <p>No pending submissions to review.</p> : (
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Affiliate</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Video Link</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Ad Code</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Submitted At</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                                    {pendingSubmissions.map(sub => (
                                        <tr key={sub.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{sub.affiliateTiktok}</td>
                                            <td className="px-3 py-4 text-sm"><a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">View Video</a></td>
                                            <td className="px-3 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{sub.adCode}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{sub.submittedAt.toLocaleString()}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <Button size="sm" onClick={() => setReviewing(sub)}>Review</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
            
            {reviewing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg">
                        <CardContent>
                            <h2 className="text-xl font-bold">Reviewing from {reviewing.affiliateTiktok}</h2>
                            <p className="text-sm"><strong>Video:</strong> <a href={reviewing.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">{reviewing.videoUrl}</a></p>
                            <p className="text-sm"><strong>Ad Code:</strong> <span className="font-mono">{reviewing.adCode}</span></p>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-green-600">Approve Submission</h3>
                                <Input label="Tracked Views at Time of Approval" type="number" value={trackedViews} onChange={e => setTrackedViews(parseInt(e.target.value))} />
                                <Button className="w-full mt-2" onClick={() => handleReview('approved')}>Approve</Button>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-red-600">Reject Submission</h3>
                                <Textarea label="Rejection Reason (Optional)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2} />
                                <Button variant="danger" className="w-full mt-2" onClick={() => handleReview('rejected')}>Reject</Button>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SubmissionReviewPage;