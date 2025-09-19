
import React, { useMemo } from 'react';
import { User } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import { UsersIcon, CheckCircleIcon, KeyIcon } from '../../components/icons/Icons';

interface DashboardViewProps {
    users: User[];
    onboardingRequestCount: number;
    passwordResetRequestCount: number;
    setActiveTab: (tab: any) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ users, onboardingRequestCount, passwordResetRequestCount, setActiveTab }) => {
    
    const funnelStats = useMemo(() => {
        return {
            prospects: users.filter(u => u.status === 'Prospect').length,
            pitched: users.filter(u => u.status === 'Pitched').length,
            applied: users.filter(u => u.status === 'Applied').length,
        };
    }, [users]);
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back! Here's a quick overview of your Creator Hub.</p>
            
            <div className="mt-8">
                <h2 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-3">Creator Recruitment Funnel</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Prospects" 
                        value={funnelStats.prospects.toLocaleString()} 
                        description="Creators you've identified but not yet contacted."
                    />
                    <StatCard 
                        title="Pitched" 
                        value={funnelStats.pitched.toLocaleString()} 
                        description="Creators you have sent an outreach email to."
                    />
                     <StatCard 
                        title="Applied" 
                        value={funnelStats.applied.toLocaleString()} 
                        description="Creators who have applied and are awaiting review."
                    />
                </div>
            </div>

            <div className="mt-10">
                <h2 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-3">Priority Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <ActionCard
                        title="Onboarding Requests"
                        count={onboardingRequestCount}
                        icon={CheckCircleIcon}
                        onClick={() => setActiveTab('onboarding')}
                        description="Creators waiting for TikTok authorization."
                        cta="Review Requests"
                    />
                     <ActionCard
                        title="Password Resets"
                        count={passwordResetRequestCount}
                        icon={KeyIcon}
                        onClick={() => setActiveTab('password-resets')}
                        description="Creators who have requested a password reset."
                        cta="Manage Resets"
                    />
                </div>
            </div>

        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    description: string;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => (
    <Card>
        <CardContent>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-4xl font-bold text-primary-600 dark:text-primary-400">{value}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </CardContent>
    </Card>
);

interface ActionCardProps {
    title: string;
    count: number;
    icon: React.FC<{className?: string}>;
    onClick: () => void;
    description: string;
    cta: string;
}
const ActionCard: React.FC<ActionCardProps> = ({ title, count, icon: Icon, onClick, description, cta }) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="flex items-center gap-4">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                </div>
            </div>
            <div className="flex-1">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <div className="text-center">
                <p className={`text-3xl font-bold ${count > 0 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>{count}</p>
                <button onClick={onClick} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    {cta}
                </button>
            </div>
        </CardContent>
    </Card>
);


export default DashboardView;
