





import React, { useState, useEffect } from 'react';
import { Leaderboard } from '../../types';
import { listenToLeaderboard, syncLeaderboardFromGoogleSheet } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LeaderboardManager: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToLeaderboard((data) => {
        setLeaderboard(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDownloadTemplate = () => {
    const headers = "rank,tiktokUsername,totalGMV,durationOnTopList,itemsSold,productsInShowcase,orders,liveGMV,videoGMV,videoViews";
    const exampleRow = "1,@topcreator,50000,3 Weeks,1200,5,1000,40000,10000,5200000";
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${exampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leaderboard_template.csv");
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
    setSyncMessage('Fetching and syncing leaderboard data...');
    const result = await syncLeaderboardFromGoogleSheet(sheetUrl);
    setSyncMessage(result.message);
    if (result.success) {
        setSheetUrl('');
    }
    setIsSyncing(false);
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">View and sync the current affiliate leaderboard.</p>

      <Card className="mt-8">
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-center">
                <div>
                    <h2 className="text-2xl font-bold">Bulk Sync Leaderboard</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        Update today's leaderboard by pasting a shareable Google Sheet link. This will overwrite any existing data for today.
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
                        {isSyncing ? 'Syncing...' : 'Sync Leaderboard'}
                    </Button>
                    {syncMessage && <p className="text-sm text-center text-gray-500 dark:text-gray-400 h-4">{syncMessage}</p>}
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">Current Leaderboard</h2>
        {loading ? (
          <p>Loading...</p>
        ) : leaderboard ? (
          <Card className="mt-4">
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">{leaderboard.timeframe}</p>
              <ul className="mt-4 space-y-3">
                {leaderboard.topAffiliates.map(affiliate => (
                  <li key={affiliate.rank} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                        <span className="font-bold text-lg text-gray-400">{affiliate.rank}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{affiliate.tiktokUsername}</span>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-400">${affiliate.totalGMV.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <p className="mt-4 text-gray-500">No leaderboard data available for today.</p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardManager;