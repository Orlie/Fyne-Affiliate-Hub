import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ContentReward, ContentSubmission } from '../../types';
import { fetchContentRewardById, submitContentForReward, listenToSubmissionsForReward } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChevronLeftIcon, CheckCircleIcon } from '../../components/icons/Icons';

const ContentRewardDetailPage: React.FC = () => {
    const { rewardId } = useParams<{ rewardId: string }>();
    const { user } = useAuth();
    const [reward, setReward] = useState<ContentReward | null>(null);
    const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!rewardId) return;
        setLoading(true);
        const loadData = async () => {
            const data = await fetchContentRewardById(rewardId);
            setReward(data);
            setLoading(false);
        };
        loadData();
        const unsubSubmissions = listenToSubmissionsForReward(rewardId, setSubmissions);
        return () => unsubSubmissions();
    }, [rewardId]);

    const mySubmissionsForThisReward = submissions.filter(s => s.affiliateId === user?.uid && s.status !== 'resubmitted');

    const leaderboard = reward?.leaderboardEnabled ? submissions
        .filter(s => s.status === 'approved' && s.payoutAmount)
        .reduce((acc, sub) => {
            const existing = acc.find(item => item.affiliateTiktok === sub.affiliateTiktok);
            if (existing) {
                existing.totalPayout += sub.payoutAmount!;
            } else {
                acc.push({ affiliateTiktok: sub.affiliateTiktok, totalPayout: sub.payoutAmount! });
            }
            return acc;
        }, [] as { affiliateTiktok: string; totalPayout: number }[])
        .sort((a, b) => b.totalPayout - a.totalPayout)
        .slice(0, 5) : null;

    if (loading) return <p className="p-4 text-center">Loading reward details...</p>;
    if (!reward) return <p className="p-4 text-center">Reward program not found.</p>;

    return (
        <div className="space-y-4">
             <div className="p-4">
                 <Link to="/rewards" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    Back to Rewards
                </Link>
            </div>
            <img src={reward.imageUrl} alt={reward.title} className="h-48 w-full object-cover" />
            <div className="p-4 space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{reward.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{reward.description}</p>
                <Button className="w-full" onClick={() => setIsModalOpen(true)}>Submit Content</Button>
                
                 {mySubmissionsForThisReward.length > 0 && (
                    <InfoSection title="Your Submissions for this Reward">
                        <div className="space-y-2">
                           {mySubmissionsForThisReward.map(sub => (
                               <div key={sub.id} className="flex justify-between items-center p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800">
                                   <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline truncate pr-2">{sub.videoUrl}</a>
                                   <span className="font-semibold whitespace-nowrap">{sub.status.replace('_', ' ')}</span>
                               </div>
                           ))}
                        </div>
                    </InfoSection>
                )}

                <InfoSection title="Requirements">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {reward.requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                </InfoSection>
                
                <InfoSection title="Assets">
                    <div className="space-y-2">
                        {reward.assets.map((asset, i) => (
                           <a href={asset.url} target="_blank" rel="noopener noreferrer" key={i} className="block">
                             <Button variant="secondary" className="w-full">{asset.name}</Button>
                           </a>
                        ))}
                    </div>
                </InfoSection>

                {leaderboard && (
                    <InfoSection title="Leaderboard">
                       <div className="space-y-2">
                           {leaderboard.map((entry, i) => (
                               <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                   <span className="font-semibold">{i + 1}. {entry.affiliateTiktok}</span>
                                   <span className="font-bold text-primary-600">${entry.totalPayout.toFixed(2)}</span>
                               </div>
                           ))}
                       </div>
                    </InfoSection>
                )}
            </div>
             {isModalOpen && user && <SubmissionModal reward={reward} user={user} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const InfoSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-3">{title}</h2>
        {children}
    </div>
);

interface SubmissionModalProps {
    reward: ContentReward;
    user: { uid: string, tiktokUsername?: string };
    onClose: () => void;
}
const SubmissionModal: React.FC<SubmissionModalProps> = ({ reward, user, onClose }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [adCode, setAdCode] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setVideoUrl('');
        setAdCode('');
        setAgreed(false);
        setError('');
        setIsSubmitted(false);
    };

    const handleSubmit = async () => {
        if (!videoUrl || !adCode) {
            setError('Please provide both a video URL and an ad code.');
            return;
        }
        if (!agreed) {
            setError('You must agree to the terms to submit.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        await submitContentForReward({
            rewardId: reward.id,
            affiliateId: user.uid,
            affiliateTiktok: user.tiktokUsername || '@unknown',
            videoUrl,
            adCode
        });
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent>
                    {isSubmitted ? (
                         <div className="text-center p-4">
                            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                            <h2 className="mt-4 text-xl font-bold">Submission Received!</h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Your video is now pending review. You can track its status in the "My Submissions" tab.
                            </p>
                            <div className="mt-6 flex flex-col gap-2">
                                <Button onClick={resetForm}>Submit Another Video</Button>
                                <Button variant="secondary" onClick={onClose}>Close</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold">Submit for: {reward.title}</h2>
                            <div className="mt-4 space-y-4">
                                <Input label="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/..." />
                                <Input label="Ad Code" value={adCode} onChange={e => setAdCode(e.target.value)} placeholder="FYNE..." />
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        I confirm this video is my original work and grant Fyne Skincare full usage rights.
                                    </span>
                                </label>
                            </div>
                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


export default ContentRewardDetailPage;