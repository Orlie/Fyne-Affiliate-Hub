

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Campaign, SampleRequest, SampleRequestStatus } from '../../types';
import { fetchCampaignById, submitSampleRequest, listenToSampleRequestsForAffiliate, affiliateConfirmsShowcase } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LightbulbIcon, ChevronLeftIcon } from '../../components/icons/Icons';


const STATUS_MAP: Record<SampleRequestStatus, { step: number; label: string }> = {
    'PendingApproval': { step: 1, label: 'Request Submitted' },
    'Rejected': { step: 1, label: 'Request Rejected' },
    'PendingShowcase': { step: 2, label: 'Admin Approved' },
    'PendingOrder': { step: 3, label: 'Added to Showcase' },
    'Shipped': { step: 4, label: 'Sample Shipped' },
};
const STATUS_STEPS = ['Request Submitted', 'Admin Approved', 'Added to Showcase', 'Sample Shipped'];


const CampaignDetailPage: React.FC = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const { user } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [request, setRequest] = useState<SampleRequest | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    
    const [fyneVideoUrl, setFyneVideoUrl] = useState('');
    const [adCode, setAdCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadCampaign = async () => {
            if (!campaignId) return;
            setLoading(true);
            try {
                const currentCampaign = await fetchCampaignById(campaignId);
                setCampaign(currentCampaign);
            } catch (err) {
                console.error("Failed to load campaign details", err);
                setError("Failed to load campaign details.");
            } finally {
                setLoading(false);
            }
        };
        loadCampaign();
    }, [campaignId]);

    useEffect(() => {
        if (!user || !campaignId) return;
        const unsubscribe = listenToSampleRequestsForAffiliate(user.uid, (userRequests) => {
             const currentRequest = userRequests.find(r => r.campaignId === campaignId);
             setRequest(currentRequest);
        });
        return () => unsubscribe();
    }, [user, campaignId]);


    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        if (!campaign || !user || isSubmitting) return;

        setIsSubmitting(true);
        const result = await submitSampleRequest({ 
            campaignId: campaign.id,
            affiliateId: user.uid,
            fyneVideoUrl,
            adCode 
        });

        if (result.success) {
            setSuccessMessage(result.message);
            // Request state will update via listener
            setFyneVideoUrl('');
            setAdCode('');
        } else {
            setError(result.message);
        }
        setIsSubmitting(false);
    };

    const handleAddToShowcase = async () => {
        if (!request || !campaign) return;
        window.open(campaign.shareLink, '_blank');
        try {
            await affiliateConfirmsShowcase(request.id);
            // UI will update via listener, moving status to 'PendingOrder'
        } catch (error) {
            console.error("Failed to confirm showcase add:", error);
            setError("There was an issue confirming your action. Please try again.");
        }
    };
    
    if (loading) return <p className="p-4 text-center">Loading campaign details...</p>;
    if (!campaign) return <p className="p-4 text-center">Campaign not found.</p>;

    const isShowcaseReady = request?.status === 'PendingShowcase';
    const currentStatusInfo = request ? STATUS_MAP[request.status] : null;
    const currentStep = currentStatusInfo ? currentStatusInfo.step : 0;

    return (
        <div className="p-4 space-y-4">
             <Link to="/" className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Campaigns
            </Link>

            <Card className="overflow-hidden">
                <img className="h-56 w-full object-cover" src={campaign.imageUrl} alt={campaign.name} />
                <CardContent>
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
                         <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{campaign.commission}%</p>
                            <p className="text-xs text-gray-500">Commission</p>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        View the full product page <a href={campaign.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">here</a>.
                    </p>
                    {campaign.contentDocUrl && (
                        <a href={campaign.contentDocUrl} target="_blank" rel="noopener noreferrer" className="block mt-4">
                            <Button variant="secondary" className="w-full flex items-center justify-center">
                                <LightbulbIcon className="h-5 w-5 mr-2" />
                                Content Inspo
                            </Button>
                        </a>
                    )}
                </CardContent>
            </Card>
            
            {request && (
                <Card>
                    <CardContent>
                        <h2 className="text-lg font-bold">Request Status</h2>
                        <div className="mt-4 flex justify-between items-center text-xs text-center">
                            {STATUS_STEPS.map((label, index) => {
                                const stepNumber = index + 1;
                                const isActive = stepNumber <= currentStep;
                                const isCurrent = stepNumber === currentStep;
                                return (
                                    <React.Fragment key={label}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {stepNumber}
                                            </div>
                                            <p className={`mt-1 font-semibold ${isCurrent ? 'text-primary-600 dark:text-primary-400' : (isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500')}`}>{label}</p>
                                        </div>
                                        {stepNumber < STATUS_STEPS.length && <div className={`flex-1 h-0.5 mt-[-1rem] ${isActive && stepNumber < currentStep ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        {request.status === 'Rejected' && <p className="text-center text-red-500 mt-2">Your request was rejected. Please check your tickets for more information.</p>}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent>
                    <h2 className="text-lg font-bold">Sample Request</h2>
                    
                    {!request ? (
                        <>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit a new Fyne Skincare video to request a free sample of this product.</p>
                            <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
                                <Input label="Fyne Video URL" placeholder="https://tiktok.com/video/..." value={fyneVideoUrl} onChange={e => setFyneVideoUrl(e.target.value)} required data-testid="fyne-video-url-input" />
                                <Input label="Ad Code" placeholder="FYNE123" value={adCode} onChange={e => setAdCode(e.target.value)} required data-testid="ad-code-input"/>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
                                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
                            </form>
                        </>
                    ) : (
                         <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                           Your request is being processed. You can monitor its progress in the status tracker above.
                         </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h2 className="text-lg font-bold">Creator Actions</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Once your sample request is approved, add the product to your showcase here.</p>
                    
                    <div className={`mt-4 space-y-6 transition-all duration-300 ${!isShowcaseReady ? 'filter grayscale opacity-50 pointer-events-none' : ''}`}>
                        <Button 
                            className="w-full"
                            data-testid="showcase-button"
                            disabled={!isShowcaseReady}
                            onClick={handleAddToShowcase}
                        >
                            Add to Showcase & Confirm
                        </Button>
                    </div>

                    {!isShowcaseReady && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                Locked until your request is approved by an admin.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CampaignDetailPage;