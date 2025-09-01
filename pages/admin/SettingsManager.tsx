import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../../types';
import { listenToGlobalSettings, updateGlobalSettings } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToGlobalSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (key: keyof GlobalSettings, value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings); // Optimistic update
    updateGlobalSettings({ [key]: value });
  };

  if (loading) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <p>Loading settings...</p>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hub Settings</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Manage global feature flags and settings for the affiliate hub.</p>

      <Card className="mt-8 max-w-2xl">
        <CardContent>
            <h2 className="text-xl font-bold">Feature Flags</h2>
            <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
                <div className="py-4 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Require Video & Ad Code for Samples</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            If ON, affiliates must submit a video/code and be approved to unlock their share link & QR code.
                        </p>
                    </div>
                    <label htmlFor="require-approval-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings?.requireVideoApproval ?? true}
                            onChange={(e) => handleToggle('requireVideoApproval', e.target.checked)}
                            id="require-approval-toggle"
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsManager;
