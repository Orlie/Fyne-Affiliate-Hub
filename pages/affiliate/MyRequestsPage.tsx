import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Campaign, SampleRequest, SampleRequestStatus } from '../../types';
import { listenToSampleRequestsForAffiliate, listenToCampaigns } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';
import { ChevronLeftIcon } from '../../components/icons/Icons';

interface RequestWithCampaign extends SampleRequest {
    campaign?: Campaign;
}

const getStatusBadge = (status: SampleRequestStatus) => {
    switch (status) {
        case 'PendingApproval':
            return { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
        case 'PendingShowcase':
            return { text: 'Approved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
        case 'PendingOrder':
            return { text: 'Ready for Order', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' };
        case 'Shipped':
            return { text: 'Shipped', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
        case 'Rejected':
            return { text: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
        default:
            return { text: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
};

const MyRequestsPage: React.FC = () => {
    const { user } = useAuth();
    const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
    const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const unsubCampaigns = listenToCampaigns((campaignData) => {
            setCampaigns(new Map(campaignData.map(c => [c.id, c])));
        });
        
        const unsubRequests = listenToSampleRequestsForAffiliate(user.uid, (requests) => {
            setAllRequests(requests);
            setLoading(false);
        });

        return () => {
            unsubCampaigns();
            unsubRequests();
        };
    }, [user]);
    
    const requestsWithCampaigns: RequestWithCampaign[] = useMemo(() => {
        return allRequests
            .map(req => ({
                ...req,
                campaign: campaigns.get(req.campaignId),
            }))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [allRequests, campaigns]);

    if (loading) {
        return <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading your requests...</p>;
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                 <Link to="/profile" className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    Back to Profile
                </Link>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">My Sample Requests</h2>
            
            {requestsWithCampaigns.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-10">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Requests Yet</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You haven't requested any samples. Browse the Campaigns tab to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {requestsWithCampaigns.map(req => {
                        const status = getStatusBadge(req.status);
                        return (
                            <Link to={`/campaign/${req.campaignId}`} key={req.id}>
                                <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <CardContent>
                                        <div className="flex items-center gap-4">
                                            <img 
                                                src={req.campaign?.imageUrl} 
                                                alt={req.campaign?.name} 
                                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0" 
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{req.campaign?.name}</h3>
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Requested on {req.createdAt.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyRequestsPage;