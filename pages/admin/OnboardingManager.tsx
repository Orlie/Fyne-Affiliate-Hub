import React from 'react';
import { User } from '../../types';
import { updateUserOnboardingStatus } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface OnboardingManagerProps {
  requests: User[];
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ requests }) => {

  const handleAuthorizationSent = async (userId: string) => {
    try {
      await updateUserOnboardingStatus(userId, 'pendingAffiliateAcceptance');
      // UI will update via listener in parent
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Affiliate Onboarding</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        These affiliates have added the product to their showcase and are waiting for you to send the TikTok authorization request.
      </p>

      <div className="mt-8">
        {requests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No affiliates are currently waiting for authorization.</p>
        ) : (
          <Card>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      TikTok Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date Joined
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map(request => (
                    <tr key={request.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.displayName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.tiktokUsername}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.createdAt?.toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button size="sm" onClick={() => handleAuthorizationSent(request.uid)}>
                          Authorization Sent
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingManager;
