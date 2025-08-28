import React, { useState, useEffect, useCallback } from 'react';
import { SampleRequest, SampleRequestStatus } from '../../types';
// FIX: Import MOCK_CAMPAIGNS to resolve the 'Cannot find name' error.
import { fetchSampleRequests, updateSampleRequestStatus, fetchCampaigns } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Campaign } from '../../types';


type QueueTab = 'PendingApproval' | 'PendingShowcase' | 'PendingOrder' | 'Shipped';

const TABS: { id: QueueTab; label: string }[] = [
    { id: 'PendingApproval', label: 'Pending Videos & Ad Codes' },
    { id: 'PendingShowcase', label: 'Approved (Pending Showcase)' },
    { id: 'PendingOrder', label: 'Ready to Order' },
    { id: 'Shipped', label: 'Ordered & Shipped' },
];

const SampleRequestQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QueueTab>('PendingApproval');
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async (tab: QueueTab) => {
    setLoading(true);
    const [requestData, campaignData] = await Promise.all([
        fetchSampleRequests(tab),
        fetchCampaigns()
    ]);
    // FIX: Convert createdAt string from mock API back to Date object
    const requestsWithDates = requestData.map(req => ({
        ...req,
        createdAt: new Date(req.createdAt)
    }));
    setRequests(requestsWithDates);
    setCampaigns(campaignData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests(activeTab);
  }, [activeTab, loadRequests]);
  
  const handleStatusUpdate = async (requestId: string, newStatus: SampleRequestStatus) => {
    await updateSampleRequestStatus(requestId, newStatus);
    loadRequests(activeTab); // Refresh the current queue
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
        {loading ? (
            <p>Loading requests...</p>
        ) : requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No requests in this queue.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map(req => {
              const campaign = campaigns.find(c => c.id === req.campaignId);
              return <RequestCard key={req.id} request={req} campaign={campaign} onStatusUpdate={handleStatusUpdate} />
            })}
          </div>
        )}
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
                    <div className="flex flex-col items-end space-y-2">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 self-start">Waiting for affiliate action.</p>
                        <a href={campaign?.adminOrderLink} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button size="sm" className="w-full" disabled>
                                Purchase Sample
                            </Button>
                        </a>
                    </div>
                );
            case 'PendingOrder':
                return (
                     <div className="flex flex-col space-y-2">
                        <a href={campaign?.adminOrderLink} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button size="sm" className="w-full" data-testid="order-link-button" disabled={!campaign?.adminOrderLink}>
                                Purchase Sample
                            </Button>
                        </a>
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