


import React, { useState, useEffect } from 'react';
import { Leaderboard } from '../../types';
import { fetchLeaderboard, syncLeaderboardFromGoogleSheet } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LeaderboardManager: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
        const data = await fetchLeaderboard();
        setLeaderboard(data);
    } catch (error) {
        console.error("Failed to load leaderboard:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!sheetUrl) {
      setSyncMessage('Please enter a Google Sheet URL.');
      return;
    }
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const syncedLeaderboard = await syncLeaderboardFromGoogleSheet(sheetUrl);
      if (syncedLeaderboard) {
          setLeaderboard(syncedLeaderboard);
          setSyncMessage('Sync successful! Leaderboard has been updated.');
      } else {
          setSyncMessage(`Sync process initiated. This requires a backend function to complete.`);
      }
    } catch (error) {
      setSyncMessage('Error syncing from Google Sheet.');
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    const headers = "rank,tiktokUsername,totalGMV,durationOnTopList,itemsSold,productsInShowcase,orders,liveGMV,videoGMV,videoViews";
    const csvContent = "data:text/csv;charset=utf-8," + headers;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leaderboard_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Sync leaderboard data from a Google Sheet.</p>

      <Card className="mt-6">
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Google Sheet Sync</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paste the URL to sync the leaderboard. This will overwrite the current data.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>Download Template</Button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="flex-grow w-full"
            />
            <Button onClick={handleSync} disabled={isSyncing} className="w-full sm:w-auto flex-shrink-0">
              {isSyncing ? 'Syncing...' : 'Sync Leaderboard'}
            </Button>
          </div>
          {syncMessage && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{syncMessage}</p>}
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