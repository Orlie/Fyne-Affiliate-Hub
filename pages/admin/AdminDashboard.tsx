
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import { SunIcon, MoonIcon, LogoutIcon, DocumentTextIcon, ChartBarIcon, StarIcon, SparklesIcon, TagIcon, TrophyIcon, BookOpenIcon, TicketIcon, UsersIcon, KeyIcon, Cog6ToothIcon, ClipboardCheckIcon, DocumentMagnifyingGlassIcon, HomeIcon } from '../../components/icons/Icons';
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
import OnboardingManager from './OnboardingManager';
import FeedbackManager from './FeedbackManager';
import ActionItemsManager from './ActionItemsManager';
import AnalyticsManager from './AnalyticsManager';
import ContentRewardsManager from './ContentRewardsManager';
import DashboardView from './DashboardView';
import { listenToPasswordResetRequests, listenToPendingOnboardingRequests, listenToAllUsers } from '../../services/mockApi';
import { User, PasswordResetRequest } from '../../types';


type AdminTab = 'dashboard' | 'onboarding' | 'requests' | 'campaigns' | 'leaderboard' | 'resources' | 'tickets' | 'incentives' | 'affiliates' | 'ai-chatbot' | 'analytics' | 'password-resets' | 'hub-settings' | 'feedback' | 'action-items' | 'content-rewards';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [onboardingRequests, setOnboardingRequests] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribeResets = listenToPasswordResetRequests(setResetRequests);
    const unsubscribeOnboarding = listenToPendingOnboardingRequests(setOnboardingRequests);
    const unsubscribeUsers = listenToAllUsers(setAllUsers);
    
    return () => {
        unsubscribeResets();
        unsubscribeOnboarding();
        unsubscribeUsers();
    };
  }, []);


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView users={allUsers} onboardingRequestCount={onboardingRequests.length} passwordResetRequestCount={resetRequests.length} setActiveTab={setActiveTab} />;
      case 'onboarding':
        return <OnboardingManager requests={onboardingRequests} />;
      case 'affiliates':
        return <AffiliatesManager />;
      case 'requests':
        return <SampleRequestQueue />;
      case 'campaigns':
        return <CampaignsManager />;
      case 'content-rewards':
        return <ContentRewardsManager />;
      case 'feedback':
        return <FeedbackManager />;
      case 'action-items':
        return <ActionItemsManager />;
      case 'leaderboard':
        return <LeaderboardManager />;
      case 'resources':
        return <ResourcesManager />;
      case 'tickets':
        return <TicketsManager />;
      case 'incentives':
        return <IncentivesManager />;
      case 'password-resets':
        return <PasswordResetManager requests={resetRequests} />;
       case 'hub-settings':
        return <SettingsManager />;
       case 'ai-chatbot':
        return <AiChatbotManager />;
       case 'analytics':
        return <AnalyticsManager />;
      default:
        return <DashboardView users={allUsers} onboardingRequestCount={onboardingRequests.length} passwordResetRequestCount={resetRequests.length} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-mint-green dark:bg-gray-900 text-dark-charcoal-gray dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Admin Hub</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <AdminNavLink text="Dashboard" icon={HomeIcon} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <AdminNavLink text="Creator CRM" icon={UsersIcon} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} />
          <AdminNavLink text="Onboarding" icon={ClipboardCheckIcon} active={activeTab === 'onboarding'} onClick={() => setActiveTab('onboarding')} badge={onboardingRequests.length > 0 ? onboardingRequests.length : undefined} />
          <AdminNavLink text="Analytics" icon={ChartBarIcon} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <AdminNavLink text="Sample Requests" icon={DocumentTextIcon} active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
          <AdminNavLink text="Campaigns" icon={TagIcon} active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
          <AdminNavLink text="Content Rewards" icon={TrophyIcon} active={activeTab === 'content-rewards'} onClick={() => setActiveTab('content-rewards')} />
          <AdminNavLink text="Affiliate Feedback" icon={DocumentMagnifyingGlassIcon} active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
          <AdminNavLink text="Action Items" icon={ClipboardCheckIcon} active={activeTab === 'action-items'} onClick={() => setActiveTab('action-items')} />
          <AdminNavLink text="Leaderboard" icon={TrophyIcon} active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
          <AdminNavLink text="Resources" icon={BookOpenIcon} active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
          <AdminNavLink text="Tickets" icon={TicketIcon} active={activeTab === 'tickets'} onClick={() => setActiveTab('tickets')} />
          <AdminNavLink text="Incentives" icon={StarIcon} active={activeTab === 'incentives'} onClick={() => setActiveTab('incentives')} />
          <AdminNavLink text="Password Resets" icon={KeyIcon} active={activeTab === 'password-resets'} onClick={() => setActiveTab('password-resets')} badge={resetRequests.length > 0 ? resetRequests.length : undefined} />
          <AdminNavLink text="Hub Settings" icon={Cog6ToothIcon} active={activeTab === 'hub-settings'} onClick={() => setActiveTab('hub-settings')} />
          <AdminNavLink text="AI Chatbot" icon={SparklesIcon} active={activeTab === 'ai-chatbot'} onClick={() => setActiveTab('ai-chatbot')} />
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