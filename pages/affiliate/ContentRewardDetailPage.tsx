
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ContentReward, ContentSubmission } from '../../types';
import { fetchContentRewardById, submitContentForReward, listenToSubmissionsForReward } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChevronLeftIcon } from '../../components/icons/Icons';

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
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!videoUrl) {
            setError('Please provide a video URL.');
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
        });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent>
                    <h2 className="text-xl font-bold">Submit for: {reward.title}</h2>
                    <div className="mt-4 space-y-4">
                        <Input label="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://tiktok.com/..." />
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
                </CardContent>
            </Card>
        </div>
    );
};


export default ContentRewardDetailPage;
