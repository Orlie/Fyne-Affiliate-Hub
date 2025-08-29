

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { SunIcon, MoonIcon, LogoutIcon, TrophyIcon, LightbulbIcon, GiftIcon, ChevronRightIcon, DocumentMagnifyingGlassIcon } from '../../components/icons/Icons';

const ProfilePage: React.FC = () => {
    const { user, updateProfile, logout, changePassword } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    
    const [discord, setDiscord] = useState(user?.discordUsername || '');
    const [tiktok, setTiktok] = useState(user?.tiktokUsername || '');
    const [phone, setPhone] = useState(user?.shippingPhoneNumber || '');
    const [isSaved, setIsSaved] = useState(false);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile({
            discordUsername: discord,
            tiktokUsername: tiktok,
            shippingPhoneNumber: phone,
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        
        try {
            await changePassword(newPassword);
            setPasswordSuccess('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordError('Failed to change password. You may need to log out and log back in.');
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">My Profile</h2>

            <Card>
                <CardContent>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        <ProfileMenuItem label="My Requests" icon={DocumentMagnifyingGlassIcon} to="/my-requests" />
                        <ProfileMenuItem label="Leaderboard" icon={TrophyIcon} to="/leaderboard" />
                        <ProfileMenuItem label="Resources" icon={LightbulbIcon} to="/resources" />
                        <ProfileMenuItem label="Incentives" icon={GiftIcon} to="/incentives" />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Account Information</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input label="Email Address" type="email" value={user?.email} disabled className="bg-gray-100 dark:bg-gray-700"/>
                        <Input label="TikTok Username" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@username" data-testid="tiktok-input" />
                        <Input label="Discord Username" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username#1234" data-testid="discord-input" />
                        <Input label="Shipping Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" data-testid="phone-input" />
                        <Button type="submit" className="w-full" data-testid="save-profile-button">{isSaved ? 'Saved!' : 'Save Changes'}</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                        <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                        <Button type="submit" variant="secondary" className="w-full">Update Password</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Support Center</h3>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Facing an issue? Let us know.</p>
                    <Button variant="secondary" className="w-full mt-4" data-testid="support-button" onClick={() => navigate('/tickets')}>
                        Go to Support Center
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Theme</span>
                    <button onClick={toggleTheme} data-testid="theme-toggle" className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                    </button>
                </CardContent>
            </Card>

            <Button variant="ghost" onClick={logout} className="w-full flex items-center justify-center" data-testid="logout-button">
                <LogoutIcon className="h-5 w-5 mr-2" />
                Logout
            </Button>
        </div>
    );
};

interface ProfileMenuItemProps {
    label: string;
    icon: React.FC<{className?: string}>;
    to: string;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ label, icon: Icon, to }) => {
    return (
        <Link to={to} className="flex items-center justify-between py-3 group">
            <div className="flex items-center">
                <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-primary-600" />
                <span className="ml-4 font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600">{label}</span>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </Link>
    );
};


export default ProfilePage;