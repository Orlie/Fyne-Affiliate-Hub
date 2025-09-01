

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import { SunIcon, MoonIcon, LogoutIcon, DocumentTextIcon, ChartBarIcon, StarIcon, SparklesIcon, TagIcon, TrophyIcon, BookOpenIcon, TicketIcon, UsersIcon, KeyIcon, Cog6ToothIcon } from '../../components/icons/Icons';
import SampleRequestQueue from './SampleRequestQueue';
import AiChatbotManager from './AiChatbotManager';
import CampaignsManager from './CampaignsManager';
import LeaderboardManager from './LeaderboardManager';
import ResourcesManager from './ResourcesManager';
import IncentivesManager from './IncentivesManager';
import TicketsManager from './TicketsManager';
import AffiliatesManager from './AffiliatesManager';
import PasswordResetManager from './PasswordResetManager';
import SettingsManager from './SettingsManager';
import { listenToPasswordResetRequests } from '../../services/mockApi';
import { PasswordResetRequest } from '../../types';


type AdminTab = 'requests' | 'campaigns' | 'leaderboard' | 'resources' | 'tickets' | 'incentives' | 'affiliates' | 'ai-chatbot' | 'analytics' | 'password-resets' | 'hub-settings';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);

  useEffect(() => {
    const unsubscribe = listenToPasswordResetRequests(setResetRequests);
    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <SampleRequestQueue />;
      case 'campaigns':
        return <CampaignsManager />;
      case 'leaderboard':
        return <LeaderboardManager />;
      case 'resources':
        return <ResourcesManager />;
      case 'tickets':
        return <TicketsManager />;
      case 'incentives':
        return <IncentivesManager />;
      case 'affiliates':
        return <AffiliatesManager />;
      case 'ai-chatbot':
        return <AiChatbotManager />;
      case 'password-resets':
        return <PasswordResetManager requests={resetRequests} />;
       case 'hub-settings':
        return <SettingsManager />;
       case 'analytics':
        return <div className="p-8 text-gray-800 dark:text-gray-200">Analytics & Reporting (Coming Soon)</div>;
      default:
        return <SampleRequestQueue />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Admin Hub</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <AdminNavLink text="Sample Requests" icon={DocumentTextIcon} active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
          <AdminNavLink text="Campaigns" icon={TagIcon} active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
          <AdminNavLink text="Affiliates" icon={UsersIcon} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} />
          <AdminNavLink text="Leaderboard" icon={TrophyIcon} active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
          <AdminNavLink text="Resources" icon={BookOpenIcon} active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
          <AdminNavLink text="Tickets" icon={TicketIcon} active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
          <AdminNavLink text="Incentives" icon={StarIcon} active={activeTab === 'incentives'} onClick={() => setActiveTab('incentives')} />
          <AdminNavLink text="Password Resets" icon={KeyIcon} active={activeTab === 'password-resets'} onClick={() => setActiveTab('password-resets')} badge={resetRequests.length > 0 ? resetRequests.length : undefined} />
          <AdminNavLink text="Hub Settings" icon={Cog6ToothIcon} active={activeTab === 'hub-settings'} onClick={() => setActiveTab('hub-settings')} />
          <AdminNavLink text="AI Chatbot" icon={SparklesIcon} active={activeTab === 'ai-chatbot'} onClick={() => setActiveTab('ai-chatbot')} />
          <AdminNavLink text="Analytics" icon={ChartBarIcon} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center">{user?.email}</p>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
            <Button variant="ghost" size="sm" onClick={logout} className="ml-4 flex items-center">
                <LogoutIcon className="h-5 w-5 mr-2"/>
                Logout
            </Button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

interface AdminNavLinkProps {
    text: string;
    active: boolean;
    onClick: () => void;
    icon: React.FC<{ className?: string }>;
    badge?: number;
}
const AdminNavLink: React.FC<AdminNavLinkProps> = ({ text, active, onClick, icon: Icon, badge }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
        active ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
        <span>{text}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badge}
        </span>
      )}
    </button>
)

export default AdminDashboard;