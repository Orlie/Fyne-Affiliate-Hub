
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfileFields } from '../../services/mockApi';
import Card, { CardContent } from '../ui/Card';

const WeeklyReminderCard: React.FC = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (user) {
            const lastDismissed = user.lastReminderDismissedAt;
            if (!lastDismissed) {
                setIsVisible(true);
            } else {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                if (lastDismissed < oneWeekAgo) {
                    setIsVisible(true);
                }
            }
        }
    }, [user]);

    const handleDismiss = () => {
        if (!user) return;
        setIsVisible(false);
        updateUserProfileFields(user.uid, { lastReminderDismissedAt: new Date() });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <Card className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
            <CardContent className="relative">
                <button 
                    onClick={handleDismiss} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label="Dismiss reminder"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 className="text-lg font-bold text-primary-800 dark:text-primary-200">Friendly Reminder: Stay Active, Get Samples!</h3>
                <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">
                    To continue being eligible for new free samples, please create at least one video per week featuring a Fyne Skincare Microneedling bundle (1, 2, or 3-month). Let's grow together!
                </p>
            </CardContent>
        </Card>
    );
};

export default WeeklyReminderCard;
