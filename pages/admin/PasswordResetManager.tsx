import React from 'react';
import { PasswordResetRequest } from '../../types';
import { resolvePasswordResetRequest } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface PasswordResetManagerProps {
  requests: PasswordResetRequest[];
}

const PasswordResetManager: React.FC<PasswordResetManagerProps> = ({ requests }) => {
  const handleResolve = async (requestId: string, email: string, shouldReset: boolean) => {
    const action = shouldReset ? 'reset the password for' : 'dismiss the request from';
    if (window.confirm(`Are you sure you want to ${action} ${email}?`)) {
      try {
        await resolvePasswordResetRequest(requestId, email, shouldReset);
        // UI will update via the listener in the parent component
      } catch (error) {
        console.error("Failed to resolve password reset request:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Password Reset Requests</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Review and act on password reset requests from affiliates.
      </p>

      <div className="mt-8">
        {requests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No pending password reset requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <Card key={request.id}>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{request.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Requested on: {request.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleResolve(request.id, request.email, true)}
                      >
                        Reset Password
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleResolve(request.id, request.email, false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetManager;
