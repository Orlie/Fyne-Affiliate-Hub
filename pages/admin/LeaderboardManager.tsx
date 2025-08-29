



import React, { useState, useEffect } from 'react';
import { Leaderboard } from '../../types';
import { fetchLeaderboard } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LeaderboardManager: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">View the current affiliate leaderboard.</p>

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