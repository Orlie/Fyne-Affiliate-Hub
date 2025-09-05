import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserOnboardingStatus } from '../../services/mockApi';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';

const TIKTOK_SHOWCASE_URL = 'https://affiliate-us.tiktok.com/api/v1/share/AJAJ1EroFawY';
const YOUTUBE_TUTORIAL_URL = 'https://youtube.com/shorts/Yia6eT6BCcM?feature=share';

const OnboardingGuide: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!user || !user.onboardingStatus || user.onboardingStatus === 'completed') {
        return null;
    }

    const handleStep1Click = async () => {
        setLoading(true);
        window.open(TIKTOK_SHOWCASE_URL, '_blank');
        try {
            await updateUserOnboardingStatus(user.uid, 'pendingAdminAuthorization');
            // State will update via listener on AuthContext, which will re-render TasksPage
        } catch (error) {
            console.error('Failed to update status:', error);
            // Optionally show an error to the user
        } finally {
            setLoading(false);
        }
    };
    
    const handleStep3Click = async () => {
        setLoading(true);
        try {
            await updateUserOnboardingStatus(user.uid, 'completed');
            // State will update and this component will disappear
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (user.onboardingStatus) {
            case 'needsToShowcase':
                return (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Step 1 of 3: Add to Showcase</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Welcome! Your first step is to add our featured <strong>1 Month Microneedling Bundle</strong> to your TikTok Showcase.
                        </p>
                        <Button className="w-full mt-4" onClick={handleStep1Click} disabled={loading}>
                            {loading ? 'Updating...' : 'Add to Showcase'}
                        </Button>
                    </div>
                );
            case 'pendingAdminAuthorization':
                return (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Step 2 of 3: Awaiting Authorization</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Great job! Our admin team has been notified. We will send you an authorization request on TikTok within 24 hours. Please keep an eye out for it!
                        </p>
                    </div>
                );
            case 'pendingAffiliateAcceptance':
                return (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Step 3 of 3: Authorize & Learn</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-3">
                           <p><strong>Action Required:</strong> Please accept the authorization request we sent you on TikTok.</p>
                           <p><strong>Action Required:</strong> Watch this quick tutorial video to learn how to get started with samples.</p>
                        </div>
                        <a href={YOUTUBE_TUTORIAL_URL} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <Button variant="secondary" className="w-full mt-4">Watch Tutorial Video</Button>
                        </a>
                        <Button className="w-full mt-2" onClick={handleStep3Click} disabled={loading}>
                            {loading ? 'Completing...' : 'All Done! Let\'s Go!'}
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="border-2 border-primary-500">
            <CardContent>
                <h2 className="text-sm font-bold uppercase text-primary-600 dark:text-primary-400 tracking-wider">Getting Started</h2>
                <div className="mt-2">
                    {renderContent()}
                </div>
            </CardContent>
        </Card>
    );
};

export default OnboardingGuide;
