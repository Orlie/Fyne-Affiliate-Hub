

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheckIcon, TagIcon, UserCircleIcon, TrophyIcon } from '../../components/icons/Icons';
import TasksPage from './TasksPage';
import CampaignsPage from './CampaignsPage';
import CampaignDetailPage from './CampaignDetailPage';
import LeaderboardPage from './LeaderboardPage';
import ResourcesPage from './ResourcesPage';
import IncentivesPage from './IncentivesPage';
import ProfilePage from './ProfilePage';
import TicketsPage from './TicketsPage';
import MyRequestsPage from './MyRequestsPage';
import ContentRewardsPage from './ContentRewardsPage';
import ContentRewardDetailPage from './ContentRewardDetailPage';
import CommunityOnboardingGate from '../../components/affiliate/CommunityOnboardingGate';
import WeeklySurveyModal from '../../components/affiliate/WeeklySurveyModal';
import { listenToSubmissionsForAffiliate } from '../../services/mockApi';

type AffiliateTab = '' | 'campaigns' | 'rewards' | 'profile';

const TABS: { id: AffiliateTab; label: string; icon: React.FC<{className?:string}> }[] = [
    { id: '', label: 'Tasks', icon: ClipboardCheckIcon },
    { id: 'campaigns', label: 'Campaigns', icon: TagIcon },
    { id: 'rewards', label: 'Rewards', icon: TrophyIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
];

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [rewardNotificationCount, setRewardNotificationCount] = useState(0);

    useEffect(() => {
        if (user) {
            const unsub = listenToSubmissionsForAffiliate(user.uid, (submissions) => {
                const unreadCount = submissions.filter(s => !s.isViewedByAffiliate).length;
                setRewardNotificationCount(unreadCount);
            });
            return () => unsub();
        }
    }, [user]);

    if (user?.onboardingStatus === 'needsToJoinCommunity') {
        return <CommunityOnboardingGate />;
    }
    
    // Determine active tab from URL path
    const currentPath = location.pathname.split('/')[1] || '';
    
    let activeTabId: AffiliateTab;
    if (currentPath === 'rewards' || currentPath === 'reward-detail') {
        activeTabId = 'rewards';
    } else if (currentPath === 'campaigns' || currentPath === 'campaign') {
        activeTabId = 'campaigns';
    } else if (['leaderboard', 'resources', 'incentives', 'tickets', 'my-requests'].includes(currentPath)) {
        activeTabId = 'profile';
    } else if (TABS.map(t => t.id).includes(currentPath as AffiliateTab)) {
        activeTabId = currentPath as AffiliateTab;
    } else {
        activeTabId = '';
    }

    const triggerSurvey = () => {
        const lastSubmission = user?.lastSurveySubmittedAt;
        if (!lastSubmission || (new Date().getTime() - lastSubmission.getTime()) > 7 * 24 * 60 * 60 * 1000) {
            setIsSurveyModalOpen(true);
        }
    };

    return (
        <div className="h-screen w-screen max-w-md mx-auto flex flex-col bg-light-mint-green dark:bg-black font-sans">
            {isSurveyModalOpen && <WeeklySurveyModal onClose={() => setIsSurveyModalOpen(false)} />}
            
            <header className="p-4 bg-white dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome, {user?.displayName?.split(' ')[0] || 'Creator'}!
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-20">
                <Routes>
                    <Route path="/" element={<TasksPage />} />
                    <Route path="/campaigns" element={<CampaignsPage />} />
                    <Route path="/campaign/:campaignId" element={<CampaignDetailPage onActionSuccess={triggerSurvey} />} />
                    <Route path="/rewards" element={<ContentRewardsPage />} />
                    <Route path="/reward-detail/:rewardId" element={<ContentRewardDetailPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/incentives" element={<IncentivesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/my-requests" element={<MyRequestsPage />} />
                </Routes>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex justify-around">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        data-testid={`nav-${tab.id || 'tasks'}`}
                        onClick={() => navigate(`/${tab.id}`)}
                        className={`relative flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs font-medium transition-colors duration-200 ${
                            activeTabId === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                    >
                        {tab.id === 'rewards' && rewardNotificationCount > 0 && (
                            <span className="absolute top-1 right-[25%] h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                                {rewardNotificationCount}
                            </span>
                        )}
                        <tab.icon className="h-6 w-6 mb-1" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default AffiliateDashboard;