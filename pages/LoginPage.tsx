
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SunIcon, MoonIcon } from '../components/icons/Icons';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Successful login will trigger a redirect from the App component
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'Admin' | 'Affiliate') => {
      const demoEmail = role === 'Admin' ? 'admin@fyne.com' : 'creator@email.com';
      // In a real app, you wouldn't hardcode passwords. This is for demo convenience.
      const demoPassword = 'password123'; 
      
      setError('');
      setLoading(true);
      try {
          await login(demoEmail, demoPassword);
      } catch (err) {
          setError(`Could not log in as ${role}. Please ensure the user '${demoEmail}' with password '${demoPassword}' exists in your Firebase Authentication project.`);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
        </button>
      </div>
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">Fyne Creator Hub</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Your all-in-one affiliate portal.</p>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-800 p-8 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Sign In</h2>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="email-input"
              disabled={loading}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
              disabled={loading}
            />
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Or use the demo buttons below.
            </p>
            <div className="flex flex-col space-y-4">
              <Button type="button" onClick={() => handleDemoLogin('Affiliate')} className="w-full" data-testid="login-affiliate-button" disabled={loading}>
                Log in as Affiliate (Demo)
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleDemoLogin('Admin')} className="w-full" data-testid="login-admin-button" disabled={loading}>
                Log in as Admin (Demo)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;