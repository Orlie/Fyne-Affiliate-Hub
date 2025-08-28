import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { fetchAllAffiliates, resetUserPasswordAdmin } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AffiliatesManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllAffiliates();
      setAffiliates(data);
    } catch (error) {
      console.error("Failed to load affiliates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  const handleResetPassword = (userId: string) => {
    if (window.confirm('Are you sure you want to reset the password for this affiliate?')) {
      resetUserPasswordAdmin(userId);
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
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
              {loading ? (
                <tr><td colSpan={5} className="text-center p-4">Loading affiliates...</td></tr>
              ) : affiliates.map((affiliate) => (
                <tr key={affiliate.uid}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{affiliate.displayName}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{affiliate.email}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{affiliate.tiktokUsername}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {affiliate.createdAt ? affiliate.createdAt.toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Button size="sm" variant="secondary" onClick={() => handleResetPassword(affiliate.uid)}>
                      Reset Password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AffiliatesManager;
