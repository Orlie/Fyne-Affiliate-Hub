import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { listenToAllAffiliates, resetUserPasswordAdmin, updateAffiliateStatus } from '../../services/mockApi';
import Button from '../../components/ui/Button';

const AffiliatesManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllAffiliates((data) => {
        setAffiliates(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleResetPassword = (userId: string) => {
    if (window.confirm('Are you sure you want to reset the password for this affiliate?')) {
      resetUserPasswordAdmin(userId);
    }
  };

  const handleToggleStatus = async (affiliate: User) => {
    const currentStatus = affiliate.status || 'Verified';
    const newStatus = currentStatus === 'Verified' ? 'Banned' : 'Verified';
    const actionText = newStatus === 'Banned' ? 'ban' : 'unban';

    if (window.confirm(`Are you sure you want to ${actionText} ${affiliate.displayName}?`)) {
      try {
        await updateAffiliateStatus(affiliate.uid, newStatus);
        // UI will update automatically via listener
      } catch (error) {
        console.error(`Failed to ${actionText} affiliate:`, error);
        alert(`Could not ${actionText} affiliate. Please try again.`);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Affiliates Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage all registered affiliates.</p>

      <div className="mt-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Display Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">TikTok</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Joined</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Loading affiliates...</td></tr>
              ) : affiliates.map((affiliate) => {
                const status = affiliate.status || 'Verified';
                return (
                  <tr key={affiliate.uid}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{affiliate.displayName}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{affiliate.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{affiliate.tiktokUsername}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {affiliate.createdAt ? affiliate.createdAt.toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        status === 'Verified' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                      <Button size="sm" variant={status === 'Verified' ? 'danger' : 'secondary'} onClick={() => handleToggleStatus(affiliate)}>
                        {status === 'Verified' ? 'Ban' : 'Unban'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleResetPassword(affiliate.uid)}>
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliatesManager;