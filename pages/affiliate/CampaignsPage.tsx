import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Campaign, SampleRequest } from '../../types';
import { fetchCampaigns, fetchSampleRequests } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent } from '../../components/ui/Card';

const CampaignsPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [requests, setRequests] = useState<SampleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'commission_high' | 'commission_low'>('newest');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [campaignsData, requestsData] = await Promise.all([
                    fetchCampaigns(),
                    fetchSampleRequests() // In a real app, you might query this for the specific user
                ]);
                
                setCampaigns(campaignsData);
                // Filter requests for the current user
                setRequests(requestsData.filter(r => r.affiliateId === user.uid));
            } catch(error) {
                console.error("Failed to load campaign data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    const categories = useMemo(() => ['All', ...new Set(campaigns.map(c => c.category))], [campaigns]);

    const sortedAndFilteredCampaigns = useMemo(() => {
        return campaigns
            .filter(c => selectedCategory === 'All' || c.category === selectedCategory)
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'newest':
                        return b.createdAt.getTime() - a.createdAt.getTime();
                    case 'oldest':
                        return a.createdAt.getTime() - b.createdAt.getTime();
                    case 'commission_high':
                        return (b.commission ?? 0) - (a.commission ?? 0);
                    case 'commission_low':
                        return (a.commission ?? 0) - (b.commission ?? 0);
                    default:
                        return 0;
                }
            });
    }, [campaigns, sortOrder, selectedCategory]);


    const getRequestStatusForCampaign = (campaignId: string) => {
        return requests.find(r => r.campaignId === campaignId);
    }

    if (loading) return <p className="p-4 text-center">Loading campaigns...</p>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partner Campaigns</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</label>
                    <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="commission_high">Highest Commission</option>
                        <option value="commission_low">Lowest Commission</option>
                    </select>
                </div>
                 <div className="flex-1">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            {sortedAndFilteredCampaigns.map(campaign => {
                const request = getRequestStatusForCampaign(campaign.id);
                
                return (
                    <Link to={`/campaign/${campaign.id}`} key={campaign.id} className="block hover:opacity-90 transition-opacity" data-testid={`campaign-card-link-${campaign.id}`}>
                        <Card className="relative overflow-hidden h-full flex flex-col">
                            <img className="h-32 w-full object-cover" src={campaign.imageUrl} alt={campaign.name} />
                            {request && (
                                <span className="absolute top-1 right-1 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                                    {request.status.replace('Pending', '...')}
                                </span>
                            )}
                             <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                {campaign.category}
                            </div>
                            <CardContent className="flex-1 flex flex-col justify-between p-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{campaign.name}</h3>
                                </div>
                                <div className="mt-2 text-right">
                                     <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{campaign.commission}%</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )
            })}
            </div>
        </div>
    );
};

export default CampaignsPage;