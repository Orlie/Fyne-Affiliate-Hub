import React, { useState, useEffect, useMemo } from 'react';
import { SampleRequest, SampleRequestStatus, Campaign } from '../../types';
import { listenToSampleRequests, updateSampleRequestStatus, listenToAllCampaignsAdmin } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons/Icons';

type QueueTab = 'PendingApproval' | 'PendingShowcase' | 'PendingOrder' | 'Shipped' | 'VideoLog';

const TABS: { id: QueueTab; label: string }[] = [
    { id: 'PendingApproval', label: 'Pending Videos & Ad Codes' },
    { id: 'PendingShowcase', label: 'Approved (Pending Showcase)' },
    { id: 'PendingOrder', label: 'Ready to Order' },
    { id: 'Shipped', label: 'Ordered & Shipped' },
    { id: 'VideoLog', label: 'Video & Ad Code Log' },
];

const ITEMS_PER_PAGE = 15;

// --- Helper Functions & Components ---

const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(fieldName => 
                JSON.stringify(row[fieldName], (_, value) => value ?? '')
            ).join(',')
        )
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    return (
        <div className="flex items-center justify-between mt-4">
            <Button size="sm" variant="secondary" onClick={handlePrevious} disabled={currentPage === 1}>
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
            </span>
            <Button size="sm" variant="secondary" onClick={handleNext} disabled={currentPage === totalPages}>
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
};


const SampleRequestQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QueueTab>('PendingApproval');
  const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for controls
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSortOrder, setOrderSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [logSortOrder, setLogSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribeRequests = listenToSampleRequests(reqs => setAllRequests(reqs));
    const unsubscribeCampaigns = listenToAllCampaignsAdmin(camps => {
      setCampaigns(camps);
      setLoading(false);
    });
    return () => {
      unsubscribeRequests();
      unsubscribeCampaigns();
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => setOrderCurrentPage(1), [searchTerm, orderSortOrder]);
  useEffect(() => setLogCurrentPage(1), [searchTerm, logSortOrder]);

  // --- Data Pipelines ---
  const filteredAndSortedOrders = useMemo(() => {
    return allRequests
      .filter(req => req.status === 'PendingOrder')
      .filter(req => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
          req.affiliateTiktok.toLowerCase().includes(lowerSearch) ||
          req.campaignName.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return orderSortOrder === 'latest' ? bTime - aTime : aTime - bTime;
      });
  }, [allRequests, searchTerm, orderSortOrder]);

  const paginatedOrders = useMemo(() => {
      const startIndex = (orderCurrentPage - 1) * ITEMS_PER_PAGE;
      return filteredAndSortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedOrders, orderCurrentPage]);

  const filteredAndSortedVideoLog = useMemo(() => {
    return allRequests
      .filter(req => req.fyneVideoUrl && req.adCode)
      .filter(req => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
          req.affiliateTiktok.toLowerCase().includes(lowerSearch) ||
          req.campaignName.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return logSortOrder === 'latest' ? bTime - aTime : aTime - bTime;
      });
  }, [allRequests, searchTerm, logSortOrder]);

  const paginatedVideoLog = useMemo(() => {
    const startIndex = (logCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedVideoLog.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedVideoLog, logCurrentPage]);
  
  // All other requests for simple tabs
  const otherRequests = useMemo(() => {
    return allRequests
      .filter(req => req.status === activeTab)
      .sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }, [allRequests, activeTab]);

  const handleStatusUpdate = async (requestId: string, newStatus: SampleRequestStatus) => {
    await updateSampleRequestStatus(requestId, newStatus);
  };
  
  const handleExport = () => {
    const dataToExport = filteredAndSortedVideoLog.map(req => ({
        dateSubmitted: req.createdAt.toISOString().split('T')[0],
        affiliateTiktok: req.affiliateTiktok,
        campaignName: req.campaignName,
        videoUrl: req.fyneVideoUrl,
        adCode: req.adCode,
        status: req.status,
    }));
    exportToCsv(dataToExport, `fyne_video_log_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderContent = () => {
    if (loading) return <p>Loading requests...</p>;
    
    if (activeTab === 'PendingOrder') {
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Input placeholder="Search Affiliate or Campaign..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <select value={orderSortOrder} onChange={e => setOrderSortOrder(e.target.value as any)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="latest">Sort by Latest First</option>
                    <option value="oldest">Sort by Oldest First</option>
                </select>
                <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md p-1">
                    <Button variant={viewMode === 'table' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="flex-1">Table</Button>
                    <Button variant={viewMode === 'grid' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="flex-1">Grid</Button>
                </div>
            </div>
            
            {filteredAndSortedOrders.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">No requests match your criteria.</p>}
            
            {viewMode === 'table' && paginatedOrders.length > 0 && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Affiliate TikTok</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Campaign</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Video/Ad Code</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                            {paginatedOrders.map(req => {
                                const campaign = campaigns.find(c => c.id === req.campaignId);
                                return (
                                    <tr key={req.id}>
                                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{req.affiliateTiktok}</td>
                                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.campaignName}</td>
                                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.createdAt.toLocaleDateString()}</td>
                                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {req.fyneVideoUrl && <a href={req.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">View Video</a>}
                                            {req.fyneVideoUrl && req.adCode && " / "}
                                            {req.adCode && <span className="font-mono">{req.adCode}</span>}
                                        </td>
                                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <div className="flex flex-col space-y-2 items-end">
                                                {campaign?.orderLink ? (
                                                    <a href={campaign.orderLink} target="_blank" rel="noopener noreferrer" className="w-full"><Button size="sm" className="w-32">Purchase Sample</Button></a>
                                                ) : (
                                                    <Button size="sm" className="w-32" disabled>Purchase Sample</Button>
                                                )}
                                                <Button size="sm" variant="secondary" className="w-32" onClick={() => handleStatusUpdate(req.id, 'Shipped')}>Mark as Shipped</Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
            {viewMode === 'grid' && paginatedOrders.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedOrders.map(req => {
                        const campaign = campaigns.find(c => c.id === req.campaignId);
                        return <RequestCard key={req.id} request={req} campaign={campaign} onStatusUpdate={handleStatusUpdate} />
                    })}
                </div>
            )}

            <Pagination currentPage={orderCurrentPage} totalItems={filteredAndSortedOrders.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setOrderCurrentPage} />
          </>
        );
    }
    
    if (activeTab === 'VideoLog') {
        return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Input placeholder="Search Affiliate or Campaign..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <select value={logSortOrder} onChange={e => setLogSortOrder(e.target.value as any)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="latest">Sort by Latest First</option>
                    <option value="oldest">Sort by Oldest First</option>
                </select>
                <Button onClick={handleExport} disabled={filteredAndSortedVideoLog.length === 0}>Export to CSV</Button>
              </div>
              {filteredAndSortedVideoLog.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">No requests match your criteria.</p>}
              {paginatedVideoLog.length > 0 && (
                 <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Date Submitted</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Affiliate TikTok</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Campaign</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Video URL</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Ad Code</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                            {paginatedVideoLog.map(req => (
                                <tr key={req.id}>
                                    <td className="py-4 pl-4 pr-3 text-sm text-gray-500 dark:text-gray-400 sm:pl-6">{req.createdAt.toLocaleDateString()}</td>
                                    <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">{req.affiliateTiktok}</td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{req.campaignName}</td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400"><a href={req.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">View Video</a></td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{req.adCode}</td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">{req.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              )}
               <Pagination currentPage={logCurrentPage} totalItems={filteredAndSortedVideoLog.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setLogCurrentPage} />
            </>
          );
    }
    
    // --- Fallback for other simple tabs ---
    if (otherRequests.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">No requests in this queue.</p>;
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherRequests.map(req => {
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
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
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
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 w-full text-right">Waiting for affiliate...</p>
                );
            case 'PendingOrder':
                return (
                     <div className="flex flex-col space-y-2 w-full">
                        {campaign?.orderLink ? (
                            <a href={campaign.orderLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button size="sm" className="w-full">Purchase Sample</Button>
                            </a>
                        ) : (
                            <Button size="sm" className="w-full" disabled>Purchase Sample</Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => onStatusUpdate(request.id, 'Shipped')}>Mark as Shipped</Button>
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
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 line-clamp-1">{request.campaignName}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{request.affiliateTiktok}</p>
                    </div>
                    <span className="text-xs text-gray-500">{request.createdAt.toLocaleDateString()}</span>
                </div>
                { (request.fyneVideoUrl || request.adCode) && (
                  <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {request.fyneVideoUrl && <p><strong>Video:</strong> <a href={request.fyneVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">View Link</a></p>}
                      {request.adCode && <p><strong>Ad Code:</strong> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{request.adCode}</span></p>}
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    {renderActions()}
                </div>
            </CardContent>
        </Card>
    );
};

export default SampleRequestQueue;
