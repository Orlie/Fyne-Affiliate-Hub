

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { SunIcon, MoonIcon, LogoutIcon } from '../../components/icons/Icons';

const ProfilePage: React.FC = () => {
    const { user, updateProfile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    
    const [discord, setDiscord] = useState(user?.discordUsername || '');
    const [tiktok, setTiktok] = useState(user?.tiktokUsername || '');
    const [phone, setPhone] = useState(user?.shippingPhoneNumber || '');
    const [isSaved, setIsSaved] = useState(false);

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

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">My Profile</h2>
            
            <Card>
                <CardContent>
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

export default ProfilePage;