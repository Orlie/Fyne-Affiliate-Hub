

import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheckIcon, HomeIcon, TrophyIcon, LightbulbIcon, GiftIcon, UserCircleIcon } from '../../components/icons/Icons';
import TasksPage from './TasksPage';
import CampaignsPage from './CampaignsPage';
import CampaignDetailPage from './CampaignDetailPage';
import LeaderboardPage from './LeaderboardPage';
import ResourcesPage from './ResourcesPage';
import IncentivesPage from './IncentivesPage';
import ProfilePage from './ProfilePage';
import TicketsPage from './TicketsPage';

type AffiliateTab = '' | 'campaigns' | 'leaderboard' | 'resources' | 'incentives' | 'profile';

const TABS: { id: AffiliateTab; label: string; icon: React.FC<{className?:string}> }[] = [
    { id: '', label: 'Tasks', icon: ClipboardCheckIcon },
    { id: 'campaigns', label: 'Campaigns', icon: HomeIcon },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
    { id: 'resources', label: 'Resources', icon: LightbulbIcon },
    { id: 'incentives', label: 'Incentives', icon: GiftIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
];

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine active tab from URL path
    const currentPath = location.pathname.split('/')[1] || '';
    
    let activeTabId: AffiliateTab;
    if (currentPath === 'campaign') {
        activeTabId = 'campaigns';
    } else if (currentPath === 'tickets') {
        activeTabId = 'profile';
    } else {
        activeTabId = currentPath as AffiliateTab;
    }


    return (
        <div className="h-screen w-screen max-w-md mx-auto flex flex-col bg-gray-50 dark:bg-black font-sans">
            <header className="p-4 text-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Welcome, {user?.tiktokUsername || 'Creator'}!
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-20">
                <Routes>
                    <Route path="/" element={<TasksPage />} />
                    <Route path="/campaigns" element={<CampaignsPage />} />
                    <Route path="/campaign/:campaignId" element={<CampaignDetailPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/incentives" element={<IncentivesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                </Routes>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        data-testid={`nav-${tab.id || 'tasks'}`}
                        onClick={() => navigate(`/${tab.id}`)}
                        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs font-medium transition-colors duration-200 ${
                            activeTabId === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                    >
                        <tab.icon className="h-6 w-6 mb-1" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default AffiliateDashboard;