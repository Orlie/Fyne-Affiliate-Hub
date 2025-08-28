
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

  // In a real app, this would be a proper form submission with validation
  // For this mock, we'll use buttons to simulate logging in as different roles.

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
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="email-input"
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
            />
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              For demo purposes, use the buttons below.
            </p>
            <div className="flex flex-col space-y-4">
              <Button type="button" onClick={() => login('Affiliate')} className="w-full" data-testid="login-affiliate-button">
                Log in as Affiliate
              </Button>
              <Button type="button" variant="secondary" onClick={() => login('Admin')} className="w-full" data-testid="login-admin-button">
                Log in as Admin
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
