

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Campaign, SampleRequest, SampleRequestStatus, GlobalSettings } from '../../types';
import { fetchCampaignById, submitSampleRequest, listenToSampleRequestsForAffiliate, affiliateConfirmsShowcase, listenToGlobalSettings } from '../../services/mockApi';
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
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [fyneVideoUrl, setFyneVideoUrl] = useState('');
    const [adCode, setAdCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
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
        loadInitialData();
    }, [campaignId]);

    useEffect(() => {
        if (!user || !campaignId) return;
        
        const unsubRequests = listenToSampleRequestsForAffiliate(user.uid, (userRequests) => {
             const currentRequest = userRequests.find(r => r.campaignId === campaignId);
             setRequest(currentRequest);
        });

        const unsubSettings = listenToGlobalSettings(setSettings);

        return () => {
            unsubRequests();
            unsubSettings();
        };
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
        if (!campaign) return; // Guard clause to ensure campaign is loaded
        
        // Always open the share link
        window.open(campaign.shareLink, '_blank');

        // Conditionally update the status if a sample request exists
        if (request) {
            try {
                await affiliateConfirmsShowcase(request.id);
                // UI will update via listener, moving status to 'PendingOrder'
            } catch (error) {
                console.error("Failed to confirm showcase add:", error);
                setError("There was an issue confirming your action. Please try again.");
            }
        }
    };
    
    if (loading || settings === null) return <p className="p-4 text-center">Loading campaign details...</p>;
    if (!campaign) return <p className="p-4 text-center">Campaign not found.</p>;

    const requireApproval = settings?.requireVideoApproval ?? true;
    const isApproved = request?.status === 'PendingShowcase';
    const isUnlocked = !requireApproval || isApproved;
    
    const currentStatusInfo = request ? STATUS_MAP[request.status] : null;
    const currentStep = currentStatusInfo ? currentStatusInfo.step : 0;

    return (
        <div className="p-4 space-y-6">
             <Link to="/campaigns" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium mb-2">
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Campaigns
            </Link>
            
            <Section title="Product Details">
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
            </Section>
            
            {request && (
                <Section title="Request Status">
                    <Card>
                        <CardContent>
                            <div className="relative pt-8">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700" style={{transform: 'translateY(-50%)'}}></div>
                                <div className="absolute top-1/2 left-0 h-0.5 bg-primary-600" style={{transform: 'translateY(-50%)', width: `${((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100}%`}}></div>
                                <div className="flex justify-between items-start relative">
                                    {STATUS_STEPS.map((label, index) => {
                                        const stepNumber = index + 1;
                                        const isActive = stepNumber <= currentStep;
                                        const isCurrent = stepNumber === currentStep;
                                        return (
                                            <div key={label} className="flex flex-col items-center text-center w-1/4">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
                                                    {isActive && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                </div>
                                                <p className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>{label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {request.status === 'Rejected' && <p className="text-center text-red-500 mt-4 text-sm font-medium">Your request was rejected. Please check your tickets for more information.</p>}
                        </CardContent>
                    </Card>
                </Section>
            )}

            <Section title="Your Actions">
                <div className="space-y-4">
                    <Card>
                        <CardContent>
                             <h2 className="text-lg font-bold">
                                {requireApproval ? "1. Request a Sample" : "Submit a Video (Optional)"}
                            </h2>
                            {!request ? (
                                <>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {requireApproval 
                                            ? "Submit a new Fyne Skincare video to request a free sample of this product."
                                            : "You can submit videos to be featured, but it's not required to get your share link."
                                        }
                                    </p>
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
                        <CardContent className={`${!isUnlocked ? 'opacity-50' : ''}`}>
                            <h2 className="text-lg font-bold">2. Creator Tools</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {requireApproval ? "Once approved, add the product to your showcase." : "Use these tools to promote the product."}
                            </p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="text-center">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(campaign.shareLink)}`} 
                                        alt="Campaign Share Link QR Code"
                                        className="mx-auto rounded-lg"
                                    />
                                    <p className="text-xs mt-2 text-gray-500">Scan to Share</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button 
                                        className="w-full"
                                        data-testid="showcase-button"
                                        disabled={!isUnlocked}
                                        onClick={handleAddToShowcase}
                                    >
                                        Add to Showcase & Confirm
                                    </Button>
                                </div>
                            </div>
                            {!isUnlocked && (
                                <p className="text-center text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-semibold">
                                    Locked until request is approved.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Section>
        </div>
    );
};


const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h2 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-3">{title}</h2>
        {children}
    </div>
);

export default CampaignDetailPage;