
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { GoogleIcon, AppleIcon } from '../components/icons/Icons';

const RegisterPage: React.FC = () => {
  const { register, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    tiktokUsername: '',
    discordUsername: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some(val => val.trim() === '')) {
      setError('Please fill out all fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { name, username, email, password, tiktokUsername, discordUsername } = formData;
      await register({
          displayName: name,
          username,
          email,
          tiktokUsername,
          discordUsername,
      }, password);
      navigate('/'); // Redirect to dashboard after successful registration
    } catch (err: any) {
      console.error(err);
      // Provide more user-friendly error messages
      let friendlyError = 'Failed to register. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'The password is too weak. Please use at least 6 characters.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      // On success, onAuthStateChanged will redirect
    } catch (err: any) {
      console.error(err.code, err.message);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(`Failed to sign up with ${provider}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">Create Account</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Join the Fyne Creator Hub</p>
        </div>
        <Card>
            <div className="p-8">
                <form className="space-y-4" onSubmit={handleRegister}>
                    <Input id="name" label="Full Name" type="text" required value={formData.name} onChange={handleChange} disabled={loading} />
                    <Input id="username" label="Username" type="text" required value={formData.username} onChange={handleChange} disabled={loading} />
                    <Input id="email" label="Email address" type="email" required value={formData.email} onChange={handleChange} disabled={loading} />
                    <Input id="password" label="Password" type="password" required value={formData.password} onChange={handleChange} disabled={loading} />
                    <Input id="confirmPassword" label="Confirm Password" type="password" required value={formData.confirmPassword} onChange={handleChange} disabled={loading} />
                    <Input id="tiktokUsername" label="TikTok Username" type="text" placeholder="@username" required value={formData.tiktokUsername} onChange={handleChange} disabled={loading} />
                    <Input id="discordUsername" label="Discord Username" type="text" placeholder="username#1234" required value={formData.discordUsername} onChange={handleChange} disabled={loading} />
                    
                    {error && <p className="text-center text-sm text-red-500">{error}</p>}
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or sign up with
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full flex items-center justify-center"
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading}
                  >
                    <GoogleIcon className="h-5 w-5 mr-2" />
                    Sign up with Google
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full flex items-center justify-center"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={loading}
                  >
                    <AppleIcon className="h-5 w-5 mr-2" />
                    Sign up with Apple
                  </Button>
                </div>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;