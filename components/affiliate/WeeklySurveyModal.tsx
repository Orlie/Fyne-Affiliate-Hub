

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitSurvey } from '../../services/mockApi';
import { SurveyChoice } from '../../types';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

interface WeeklySurveyModalProps {
    onClose: () => void;
    customPrompt?: string;
    isManualRequest?: boolean;
}

const SURVEY_OPTIONS: { id: SurveyChoice, label: string, emoji: string }[] = [
    { id: 'More Earnings & Opportunities', label: 'More Earnings & Opportunities', emoji: '💰' },
    { id: 'Sales Growth Guides', label: 'Sales Growth Guides', emoji: '📈' },
    { id: 'Creator Skills Training', label: 'Creator Skills Training', emoji: '🎬' },
    { id: 'Product Support', label: 'Product Support', emoji: '📦' },
    { id: 'Admin Support', label: 'Admin Support', emoji: '🛡️' },
    { id: 'Other', label: 'Other', emoji: '💡' },
];

const WeeklySurveyModal: React.FC<WeeklySurveyModalProps> = ({ onClose, customPrompt, isManualRequest = false }) => {
    const { user } = useAuth();
    const [selectedChoice, setSelectedChoice] = useState<SurveyChoice | null>(null);
    const [otherText, setOtherText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!user || !selectedChoice) return;
        setIsSubmitting(true);
        try {
            await submitSurvey({
                affiliateId: user.uid,
                affiliateTiktok: user.tiktokUsername || '@unknown',
                choice: selectedChoice,
                otherText: selectedChoice === 'Other' ? otherText : '',
            }, isManualRequest);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Failed to submit survey:', error);
            // Optionally show an error message
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent>
                    {isSubmitted ? (
                        <div className="text-center p-4">
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Thank You!</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                {isManualRequest
                                  ? "Your feedback has been sent to our team. We appreciate your input!"
                                  : "Your feedback has been received, and you've been entered into this week's draw. Good luck!"
                                }
                            </p>
                            <Button onClick={onClose} className="mt-6 w-full">Close</Button>
                        </div>
                    ) : (
                        <>
                            {!isManualRequest && (
                                <div className="text-center p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                                    <h3 className="font-bold text-primary-800 dark:text-primary-200">🌟 Weekly Feedback Draw! 🌟</h3>
                                    <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                                        Complete this 1-minute survey and get an entry into our weekly draw for a $10 gift card!
                                    </p>
                                </div>
                            )}

                            <h2 className="text-lg font-bold text-center mt-4">
                                {customPrompt || 'How can we improve your experience?'}
                            </h2>
                            <div className="mt-4 space-y-3">
                                {SURVEY_OPTIONS.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setSelectedChoice(option.id)}
                                        className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-200 flex items-center ${
                                            selectedChoice === option.id 
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                                        }`}
                                    >
                                        <span className="text-xl mr-3">{option.emoji}</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{option.label}</span>
                                    </button>
                                ))}
                                {selectedChoice === 'Other' && (
                                    <Textarea
                                        value={otherText}
                                        onChange={e => setOtherText(e.target.value)}
                                        placeholder="Please tell us more..."
                                        rows={3}
                                    />
                                )}
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                <Button variant="secondary" onClick={onClose} className="flex-1">Skip</Button>
                                <Button onClick={handleSubmit} disabled={!selectedChoice || isSubmitting} className="flex-1">
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default WeeklySurveyModal;