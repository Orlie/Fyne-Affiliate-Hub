import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/mockApi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setMessage("If an account with this email exists, a password reset request has been sent to the admin for review. You will be contacted once it's reset.");
      setEmail('');
    } catch (err: any) {
      console.error("Password reset request failed:", err);
      // Show generic message for security
      setMessage("If an account with this email exists, a password reset request has been sent to the admin for review. You will be contacted once it's reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">Reset Password</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Request a password reset from an admin.</p>
        </div>
        <Card>
          <div className="p-8">
            {message ? (
              <div className="text-center">
                <p className="text-green-600 dark:text-green-400">{message}</p>
                <Link to="/login" className="mt-4 inline-block font-medium text-primary-600 hover:text-primary-500">
                  &larr; Back to Sign In
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                  id="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                {error && <p className="text-center text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending Request...' : 'Send Reset Request'}
                </Button>
              </form>
            )}
            {!message && (
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Remember your password?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
