
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Campaign, SampleRequest } from '../../types';
import { fetchCampaignById, submitSampleRequest, fetchSampleRequests } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LightbulbIcon } from '../../components/icons/Icons';

// A simple back icon
const ChevronLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);


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
        const loadData = async () => {
            if (!campaignId || !user) return;
            setLoading(true);
            try {
                const currentCampaign = await fetchCampaignById(campaignId);
                setCampaign(currentCampaign);

                // Fetch only requests for this user, then find the one for this campaign
                const allUserRequests = await fetchSampleRequests();
                const userRequests = allUserRequests.filter(r => r.affiliateId === user.uid);
                const currentRequest = userRequests.find(r => r.campaignId === campaignId);
                setRequest(currentRequest);

            } catch (err) {
                console.error("Failed to load campaign details", err);
                setError("Failed to load campaign details.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [campaignId, user]);

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
            // Refetch requests to update UI state
            const allUserRequests = await fetchSampleRequests();
            const userRequests = allUserRequests.filter(r => r.affiliateId === user.uid);
            const currentRequest = userRequests.find(r => r.campaignId === campaign.id);
            setRequest(currentRequest);
            setFyneVideoUrl('');
            setAdCode('');
        } else {
            setError(result.message);
        }
        setIsSubmitting(false);
    };
    
    if (loading) return <p className="p-4 text-center">Loading campaign details...</p>;
    if (!campaign) return <p className="p-4 text-center">Campaign not found.</p>;

    const isShowcaseReady = request?.status === 'PendingShowcase' || request?.status === 'PendingOrder' || request?.status === 'Shipped';

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
                        <div className="mt-4">
                            <p className="text-sm"><strong>Status:</strong> 
                                <span className="ml-2 font-semibold p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{request.status}</span>
                            </p>
                            {request.status === 'PendingShowcase' && <div className="mt-2 text-xs text-center text-green-600 dark:text-green-400">Action required: Add to your showcase to proceed!</div>}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h2 className="text-lg font-bold">Creator Actions</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Once your sample request is approved, you can add this product to your showcase.</p>
                    
                    <div className={`mt-4 space-y-6 transition-all duration-300 ${!isShowcaseReady ? 'filter blur-sm grayscale opacity-50 pointer-events-none' : ''}`}>
                        <Button 
                            className="w-full"
                            data-testid="showcase-button"
                            disabled={!isShowcaseReady}
                            onClick={() => {
                                window.open(campaign.shareLink, '_blank');
                            }}
                        >
                            Add to Showcase
                        </Button>

                        <div className="flex flex-col items-center">
                            <div className="p-2 bg-white rounded-lg inline-block shadow-md">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(campaign.shareLink)}`} 
                                    alt="Add to Showcase QR Code"
                                    width="150"
                                    height="150"
                                    className="rounded-md"
                                    data-testid="qr-code-image"
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Scan to add to showcase</p>
                        </div>
                    </div>

                    {!isShowcaseReady && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                Locked until request is approved.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CampaignDetailPage;