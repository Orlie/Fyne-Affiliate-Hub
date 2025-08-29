

import React, { useState, useEffect } from 'react';
import { Leaderboard } from '../../types';
// FIX: Replaced `fetchLeaderboard` with `listenToLeaderboard` as `fetchLeaderboard` is not exported from the API.
import { listenToLeaderboard } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';

const LeaderboardPage: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // FIX: The component is now updated to use the listener pattern for real-time data updates.
        setLoading(true);
        const unsubscribe = listenToLeaderboard((data) => {
            setLeaderboard(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <p className="p-4 text-center">Loading leaderboard...</p>;
    if (!leaderboard) return <p className="p-4 text-center">Leaderboard data for today is not available yet.</p>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Top Affiliates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{leaderboard.timeframe}</p>
            
            {leaderboard.topAffiliates.map((affiliate, index) => (
                <Card key={affiliate.rank} className={`border-2 ${
                    index === 0 ? 'border-yellow-400' :
                    index === 1 ? 'border-gray-300 dark:border-gray-500' :
                    index === 2 ? 'border-yellow-600/50 dark:border-yellow-700' :
                    'border-transparent'
                }`}>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8 text-center">{affiliate.rank}</div>
                            <div className="flex-1">
                                <p className="font-bold text-lg text-gray-900 dark:text-white">{affiliate.tiktokUsername}</p>
                                <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
                                    ${affiliate.totalGMV.toLocaleString()} GMV
                                </p>
                            </div>
                            {index === 0 && <span className="text-2xl">🏆</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                           <div><strong>Items Sold:</strong> {affiliate.itemsSold}</div>
                           <div><strong>Orders:</strong> {affiliate.orders}</div>
                           <div><strong>Video Views:</strong> {(affiliate.videoViews/1000000).toFixed(1)}M</div>
                           <div><strong>Duration:</strong> {affiliate.durationOnTopList}</div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default LeaderboardPage;