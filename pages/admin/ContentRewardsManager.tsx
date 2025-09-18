
import React, { useState, useEffect } from 'react';
import { ContentReward } from '../../types';
import { listenToContentRewards, createContentReward, updateContentReward } from '../../services/mockApi';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import RewardEditorModal from './RewardEditorModal';
import SubmissionReviewPage from './SubmissionReviewPage';

const ContentRewardsManager: React.FC = () => {
    const [rewards, setRewards] = useState<ContentReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentReward, setCurrentReward] = useState<Partial<ContentReward> | null>(null);
    const [view, setView] = useState<'list' | 'review'>('list');
    const [selectedReward, setSelectedReward] = useState<ContentReward | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToContentRewards(data => {
            setRewards(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (reward?: ContentReward) => {
        setCurrentReward(reward || {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentReward(null);
    };

    const handleSave = async (rewardData: Omit<ContentReward, 'id' | 'createdAt' | 'paidOut'> | (Partial<ContentReward> & { id: string })) => {
        if ('id' in rewardData) {
            await updateContentReward(rewardData);
        } else {
            await createContentReward(rewardData);
        }
        handleCloseModal();
    };
    
    const handleOpenReview = (reward: ContentReward) => {
        setSelectedReward(reward);
        setView('review');
    };

    if (loading) {
        return <div className="p-8 text-center">Loading Content Rewards...</div>;
    }
    
    if (view === 'review' && selectedReward) {
        return <SubmissionReviewPage reward={selectedReward} onBack={() => setView('list')} />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Rewards</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Create and manage performance-based rewards for your affiliates.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>Create New Reward</Button>
            </div>
            
            <div className="mt-8 space-y-4">
                {rewards.length === 0 ? (
                    <p className="text-center text-gray-500">No content reward programs have been created yet.</p>
                ) : (
                    rewards.map(reward => {
                        const progress = Math.min((reward.paidOut / reward.totalBudget) * 100, 100);
                        return (
                             <Card key={reward.id}>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <img src={reward.imageUrl} alt={reward.title} className="w-16 h-16 rounded-md object-cover hidden sm:block" />
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{reward.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        ${reward.rewardValue.toFixed(2)} {reward.rewardUnit}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                            <Button size="sm" variant="secondary" onClick={() => handleOpenReview(reward)}>Review Submissions</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleOpenModal(reward)}>Edit</Button>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Budget: ${reward.paidOut.toLocaleString()} / ${reward.totalBudget.toLocaleString()}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {isModalOpen && (
                <RewardEditorModal
                    reward={currentReward}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default ContentRewardsManager;
