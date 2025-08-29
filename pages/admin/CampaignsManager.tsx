





import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';
import { fetchAllCampaignsAdmin, syncCampaignsFromGoogleSheet } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const CampaignsManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
        const data = await fetchAllCampaignsAdmin();
        setCampaigns(data);
    } catch (error) {
        console.error("Failed to load campaigns:", error);
    } finally {
        setLoading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    const headers = "id,category,name,imageUrl,productUrl,shareLink,commission,active,adminOrderLink";
    const exampleRow = "PROD001,Skincare,Vitamin C Serum,https://example.com/image.jpg,https://example.com/product,https://example.com/share,15,true,https://example.com/admin_order";
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${exampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "campaign_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSync = async () => {
    if (!sheetUrl.trim()) {
        setSyncMessage('Please paste the Google Sheet link before syncing.');
        return;
    }
    setIsSyncing(true);
    setSyncMessage('Fetching from URL, parsing with AI, and updating database...');
    const result = await syncCampaignsFromGoogleSheet(sheetUrl);
    setSyncMessage(result.message);
    if (result.success) {
        setSheetUrl('');
        // Reload campaigns to show the updated list
        await loadCampaigns();
    }
    setIsSyncing(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Manage campaigns and sync in bulk from a spreadsheet.</p>
      
       <Card className="mt-8">
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Bulk Campaign Sync</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        Sync campaigns by pasting a shareable Google Sheet link. The sheet must be shared with "Anyone with the link". We'll sync from the first tab.
                    </p>
                    <Button variant="secondary" onClick={handleDownloadTemplate} className="mt-4">
                        Download CSV Template
                    </Button>
                  </div>
                  <div className="space-y-3">
                     <Input
                        label="Google Sheet Share Link"
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        disabled={isSyncing}
                     />
                     <Button onClick={handleSync} disabled={isSyncing} className="w-full">
                        {isSyncing ? 'Syncing...' : 'Sync Campaigns'}
                     </Button>
                     {syncMessage && <p className="text-sm text-center text-gray-500 dark:text-gray-400 h-4">{syncMessage}</p>}
                  </div>
              </div>
          </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">Current Campaigns ({campaigns.length})</h2>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">ID</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Commission</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-white">Admin Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                        ) : campaigns.map((campaign) => (
                            <tr key={campaign.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 sm:pl-6">{campaign.id}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{campaign.category}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{campaign.commission}%</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${campaign.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'}`}>
                                        {campaign.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                    <a href={campaign.adminOrderLink} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="secondary" disabled={!campaign.adminOrderLink}>
                                            Purchase
                                        </Button>
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsManager;