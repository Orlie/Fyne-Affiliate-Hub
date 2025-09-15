import React, { useState, useEffect, useMemo } from 'react';
import { SampleRequest, SampleRequestStatus } from '../../types';
import { listenToSampleRequests, updateSampleRequestStatus, listenToAllCampaignsAdmin } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Campaign } from '../../types';


type QueueTab = 'PendingApproval' | 'PendingShowcase' | 'PendingOrder' | 'Shipped' | 'VideoLog';

const TABS: { id: QueueTab; label: string }[] = [
    { id: 'PendingApproval', label: 'Pending Videos & Ad Codes' },
    { id: 'PendingShowcase', label: 'Approved (Pending Showcase)' },
    { id: 'PendingOrder', label: 'Ready to Order' },
    { id: 'Shipped', label: 'Ordered & Shipped' },
    { id: 'VideoLog', label: 'Video & Ad Code Log' },
];

const SampleRequestQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QueueTab>('PendingApproval');
  const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [orderSortOrder, setOrderSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [logSortOrder, setLogSortOrder] = useState<'latest' | 'oldest'>('latest');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToSampleRequests((requestData) => {
        setAllRequests(requestData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const requests = useMemo(() => {
    const filtered = allRequests.filter(req => req.status === activeTab);
    
    if (activeTab === 'PendingOrder') {
        return filtered.sort((a, b) => {
            if (orderSortOrder === 'latest') {
                return b.createdAt.getTime() - a.createdAt.getTime();
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
    }

    // Default sort for other tabs
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allRequests, activeTab, orderSortOrder]);
  
  const videoLogRequests = useMemo(() => {
    return allRequests
        .filter(req => req.fyneVideoUrl) // Filter for requests that have a video URL
        .sort((a, b) => {
            if (logSortOrder === 'latest') {
                return b.createdAt.getTime() - a.createdAt.getTime();
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
  }, [allRequests, logSortOrder]);


  useEffect(() => {
    setCampaignsLoading(true);
    const unsubscribe = listenToAllCampaignsAdmin((campaignData) => {
        setCampaigns(campaignData);
        setCampaignsLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleStatusUpdate = async (requestId: string, newStatus: SampleRequestStatus) => {
    // UI will update optimistically via the listener
    await updateSampleRequestStatus(requestId, newStatus);
  };
  
  const SortControl: React.FC<{
    value: 'latest' | 'oldest';
    onChange: (value: 'latest' | 'oldest') => void;
  }> = ({ value, onChange }) => (
    <div className="mb-4 flex justify-end">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as 'latest' | 'oldest')}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            aria-label="Sort order"
        >
            <option value="latest">Sort by Latest First</option>
            <option value="oldest">Sort by Oldest First</option>
        </select>
    </div>
  );
  
  const renderContent = () => {
    if (loading || campaignsLoading) {
      return <p>Loading requests...</p>;
    }
    
    if (activeTab === 'PendingOrder') {
        if (requests.length === 0) return <p className="text-gray-500 dark:text-gray-400">No requests in this queue.</p>;
        return (
            <>
              <SortControl value={orderSortOrder} onChange={setOrderSortOrder} />
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Affiliate TikTok</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Campaign Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date Requested</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Fyne Video URL</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Ad Code</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                        {requests.map(req => {
                            const campaign = campaigns.find(c => c.id === req.campaignId);
                            return (
                                <tr key={req.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{req.affiliateTiktok}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.campaignName}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.createdAt.toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400"><a href={req.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">View Video</a></td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{req.adCode}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex flex-col space-y-2 items-end">
                                            {campaign?.orderLink ? (
                                                <a href={campaign.orderLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                                    <Button size="sm" className="w-32" data-testid="order-link-button">Purchase Sample</Button>
                                                </a>
                                            ) : (
                                                <div className="text-center">
                                                    <Button size="sm" className="w-32" disabled>Purchase Sample</Button>
                                                </div>
                                            )}
                                            <Button size="sm" variant="secondary" className="w-32" data-testid="mark-shipped-button" onClick={() => handleStatusUpdate(req.id, 'Shipped')}>Mark as Shipped</Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
              </div>
            </>
          );
    }
    
    if (activeTab === 'VideoLog') {
        if (videoLogRequests.length === 0) return <p className="text-gray-500 dark:text-gray-400">No requests with submitted videos found.</p>;
        return (
            <>
              <SortControl value={logSortOrder} onChange={setLogSortOrder} />
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Date Submitted</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Affiliate TikTok</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Campaign Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Video URL</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Ad Code</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                        {videoLogRequests.map(req => (
                            <tr key={req.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 dark:text-gray-400 sm:pl-6">{req.createdAt.toLocaleDateString()}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">{req.affiliateTiktok}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.campaignName}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400"><a href={req.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">View Video</a></td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{req.adCode}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">{req.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </>
          );
    }
    
    if (requests.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">No requests in this queue.</p>;
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map(req => {
                const campaign = campaigns.find(c => c.id === req.campaignId);
                return <RequestCard key={req.id} request={req} campaign={campaign} onStatusUpdate={handleStatusUpdate} />
            })}
        </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sample Request Management</h1>
      
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

interface RequestCardProps {
    request: SampleRequest;
    campaign?: Campaign;
    onStatusUpdate: (requestId: string, newStatus: SampleRequestStatus) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, campaign, onStatusUpdate }) => {
    const renderActions = () => {
        switch (request.status) {
            case 'PendingApproval':
                return (
                    <div className="flex space-x-2">
                        <Button size="sm" data-testid="approve-button" onClick={() => onStatusUpdate(request.id, 'PendingShowcase')}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => onStatusUpdate(request.id, 'Rejected')}>Reject</Button>
                    </div>
                );
            case 'PendingShowcase':
                 return (
                    <div className="flex flex-col items-start space-y-2 w-full">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Waiting for affiliate to add product to their TikTok showcase.</p>
                    </div>
                );
            case 'PendingOrder':
                return (
                     <div className="flex flex-col space-y-2 w-full">
                        {campaign?.orderLink ? (
                            <a href={campaign.orderLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button size="sm" className="w-full" data-testid="order-link-button">
                                    Purchase Sample
                                </Button>
                            </a>
                        ) : (
                            <div className="text-center w-full">
                                <Button size="sm" className="w-full" disabled>
                                    Purchase Sample
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">Order link not provided.</p>
                            </div>
                        )}
                        <Button size="sm" variant="secondary" data-testid="mark-shipped-button" onClick={() => onStatusUpdate(request.id, 'Shipped')}>Mark as Shipped</Button>
                    </div>
                );
            case 'Shipped':
                 return <p className="text-sm text-green-600 dark:text-green-400">Fulfilled.</p>;
            default:
                return null;
        }
    }

    return (
        <Card data-testid={`request-card-${request.id}`}>
            <CardContent>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{request.campaignName}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{request.affiliateTiktok}</p>
                    </div>
                    <span className="text-xs text-gray-500">{request.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Video URL:</strong> <a href={request.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{request.fyneVideoUrl}</a></p>
                    <p><strong>Ad Code:</strong> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{request.adCode}</span></p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    {renderActions()}
                </div>
            </CardContent>
        </Card>
    );
};

export default SampleRequestQueue;