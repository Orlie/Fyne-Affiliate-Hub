import React, { useState, useEffect, useMemo } from 'react';
import { User, SampleRequest, Campaign } from '../../types';
// FIX: Replaced non-existent 'listenToAllAffiliates' with 'listenToAllUsers'.
import { listenToAllUsers, listenToSampleRequests, listenToAllCampaignsAdmin } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import SimpleBarChart from '../../components/ui/SimpleBarChart';
import HorizontalBarChart from '../../components/ui/HorizontalBarChart';

type Timeframe = '7d' | '30d' | '90d';

const AnalyticsManager: React.FC = () => {
    const [timeframe, setTimeframe] = useState<Timeframe>('7d');
    const [allAffiliates, setAllAffiliates] = useState<User[]>([]);
    const [allRequests, setAllRequests] = useState<SampleRequest[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // FIX: Replaced non-existent 'listenToAllAffiliates' with 'listenToAllUsers'.
        const unsubAffiliates = listenToAllUsers(setAllAffiliates);
        const unsubRequests = listenToSampleRequests(setAllRequests);
        const unsubCampaigns = listenToAllCampaignsAdmin(campaigns => {
            setAllCampaigns(campaigns);
            setLoading(false);
        });
        return () => {
            unsubAffiliates();
            unsubRequests();
            unsubCampaigns();
        };
    }, []);

    const analyticsData = useMemo(() => {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const now = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // End of today
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);

        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);

        // --- Filter data for current and previous periods ---
        const affiliatesInPeriod = allAffiliates.filter(a => a.createdAt && a.createdAt >= startDate && a.createdAt < endDate);
        const requestsInPeriod = allRequests.filter(r => r.createdAt && r.createdAt >= startDate && r.createdAt < endDate);
        
        const affiliatesInPrevPeriod = allAffiliates.filter(a => a.createdAt && a.createdAt >= prevStartDate && a.createdAt < prevEndDate);
        const requestsInPrevPeriod = allRequests.filter(r => r.createdAt && r.createdAt >= prevStartDate && r.createdAt < prevEndDate);

        // --- Calculate KPIs and comparisons ---
        const calcComparison = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const kpis = {
            totalAffiliates: allAffiliates.length,
            totalRequests: allRequests.length,
            newAffiliates: {
                value: affiliatesInPeriod.length,
                change: calcComparison(affiliatesInPeriod.length, affiliatesInPrevPeriod.length)
            },
            newRequests: {
                value: requestsInPeriod.length,
                change: calcComparison(requestsInPeriod.length, requestsInPrevPeriod.length)
            }
        };

        // --- Aggregate data for charts ---
        const aggregateBy = timeframe === '90d' ? 'week' : 'day';
        const chartData: { label: string, affiliates: number, requests: number }[] = [];
        
        const tempDate = new Date(startDate);
        if (aggregateBy === 'day') {
            while (tempDate < endDate) {
                const dayStr = tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                chartData.push({ label: dayStr, affiliates: 0, requests: 0 });
                tempDate.setDate(tempDate.getDate() + 1);
            }
        } else { // Week
            while (tempDate < endDate) {
                const weekStartStr = tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                chartData.push({ label: `W/c ${weekStartStr}`, affiliates: 0, requests: 0 });
                tempDate.setDate(tempDate.getDate() + 7);
            }
        }
        
        affiliatesInPeriod.forEach(a => {
            const date = a.createdAt!;
            const index = aggregateBy === 'day' 
                ? Math.floor((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
                : Math.floor((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 7));
            if (chartData[index]) chartData[index].affiliates++;
        });

        requestsInPeriod.forEach(r => {
            const date = r.createdAt!;
            const index = aggregateBy === 'day'
                ? Math.floor((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
                : Math.floor((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 7));
            if (chartData[index]) chartData[index].requests++;
        });

        // --- Calculate Top Campaigns ---
        const campaignCounts = requestsInPeriod.reduce((acc, req) => {
            acc[req.campaignId] = (acc[req.campaignId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCampaigns = Object.entries(campaignCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([campaignId, count]) => ({
                label: allCampaigns.find(c => c.id === campaignId)?.name || 'Unknown Campaign',
                value: count
            }));

        return { kpis, chartData, topCampaigns };

    }, [timeframe, allAffiliates, allRequests, allCampaigns]);


    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    const { kpis, chartData, topCampaigns } = analyticsData;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Insights</h1>
            
            <div className="mt-4">
                <div className="flex space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-sm">
                    {(['7d', '30d', '90d'] as Timeframe[]).map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`flex-1 py-1.5 px-3 text-sm font-semibold rounded-md transition-colors ${timeframe === t ? 'bg-white dark:bg-gray-900 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>
                            Last {t.replace('d','')} Days
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Total Affiliates" value={kpis.totalAffiliates.toLocaleString()} />
                <KpiCard title="Total Sample Requests" value={kpis.totalRequests.toLocaleString()} />
                <KpiCard title={`New Affiliates (${timeframe.replace('d','')}d)`} value={kpis.newAffiliates.value.toLocaleString()} change={kpis.newAffiliates.change} />
                <KpiCard title={`New Requests (${timeframe.replace('d','')}d)`} value={kpis.newRequests.value.toLocaleString()} change={kpis.newRequests.change} />
            </div>
            
            <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card>
                    <CardContent>
                        <h2 className="text-xl font-bold">Affiliate Growth</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">New affiliates over the last {timeframe.replace('d','')} days.</p>
                        <div className="h-72 mt-4">
                            <SimpleBarChart data={chartData.map(d => ({label: d.label, value: d.affiliates}))} label="New Affiliates" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                     <CardContent>
                        <h2 className="text-xl font-bold">Sample Request Volume</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">New requests over the last {timeframe.replace('d','')} days.</p>
                         <div className="h-72 mt-4">
                            <SimpleBarChart data={chartData.map(d => ({label: d.label, value: d.requests}))} label="New Requests" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-8">
                 <Card>
                     <CardContent>
                        <h2 className="text-xl font-bold">Top Performing Campaigns</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Most requested campaigns in the last {timeframe.replace('d','')} days.</p>
                         <div className="h-72 mt-4">
                            <HorizontalBarChart data={topCampaigns} label="Requests" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

interface KpiCardProps {
    title: string;
    value: string;
    change?: number;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, change }) => {
    const isPositive = change !== undefined && change >= 0;
    return (
        <Card>
            <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                {change !== undefined && (
                     <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% vs. previous period
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default AnalyticsManager;