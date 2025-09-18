import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from '../../types';
import { listenToAllAffiliates, resetUserPasswordAdmin, updateAffiliateStatus, requestFeedbackFromAffiliates } from '../../services/mockApi';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Textarea from '../../components/ui/Textarea';

const FEEDBACK_TEMPLATES = [
    { title: 'General Check-in', prompt: 'Just checking in! How are things going? We\'d love to hear any feedback you have about the Fyne Creator Hub or recent campaigns.' },
    { title: 'Onboarding Feedback', prompt: 'We see you\'ve recently joined us! How was your onboarding experience? Is there anything we can do to make it smoother for new creators?' },
    { title: 'Top Performer Insights', prompt: 'You\'ve been doing an amazing job! What strategies are working best for you right now? We\'d love to learn from your success.' },
];

const AffiliatesManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliates, setSelectedAffiliates] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackPrompt, setFeedbackPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllAffiliates((data) => {
        setAffiliates(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      const isIndeterminate = selectedAffiliates.size > 0 && selectedAffiliates.size < affiliates.length;
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedAffiliates, affiliates.length]);
  
  const handleSelectOne = (uid: string) => {
      setSelectedAffiliates(prev => {
          const newSet = new Set(prev);
          if (newSet.has(uid)) {
              newSet.delete(uid);
          } else {
              newSet.add(uid);
          }
          return newSet;
      });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedAffiliates(new Set(affiliates.map(a => a.uid)));
      } else {
          setSelectedAffiliates(new Set());
      }
  };
  
  const handleSelectSegment = (segment: 'new' | 'top' | 'inactive') => {
      let segmentUids: string[] = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      switch (segment) {
          case 'new':
              segmentUids = affiliates
                  .filter(a => a.createdAt && new Date(a.createdAt) > thirtyDaysAgo)
                  .map(a => a.uid);
              break;
          case 'top':
              const topCount = Math.ceil(affiliates.length * 0.1); // Top 10%
              segmentUids = [...affiliates]
                  .sort((a, b) => (b.cumulativeGMV || 0) - (a.cumulativeGMV || 0))
                  .slice(0, topCount)
                  .map(a => a.uid);
              break;
          case 'inactive':
               segmentUids = affiliates
                  .filter(a => !a.cumulativeGMV || a.cumulativeGMV === 0)
                  .map(a => a.uid);
              break;
      }
      setSelectedAffiliates(new Set(segmentUids));
  };

  const handleResetPassword = (userId: string) => {
    if (window.confirm('Are you sure you want to reset the password for this affiliate?')) {
      resetUserPasswordAdmin(userId);
    }
  };

  const handleToggleStatus = async (affiliate: User) => {
    const currentStatus = affiliate.status || 'Verified';
    const newStatus = currentStatus === 'Verified' ? 'Banned' : 'Verified';
    const actionText = newStatus === 'Banned' ? 'ban' : 'unban';

    if (window.confirm(`Are you sure you want to ${actionText} ${affiliate.displayName}?`)) {
      try {
        await updateAffiliateStatus(affiliate.uid, newStatus);
        // UI will update automatically via listener
      } catch (error) {
        console.error(`Failed to ${actionText} affiliate:`, error);
        alert(`Could not ${actionText} affiliate. Please try again.`);
      }
    }
  };

  const handleSendFeedbackRequest = async () => {
    if (!feedbackPrompt.trim()) {
        alert("Please enter a prompt for your feedback request.");
        return;
    }
    setIsSending(true);
    await requestFeedbackFromAffiliates(Array.from(selectedAffiliates), feedbackPrompt);
    setIsSending(false);
    setIsModalOpen(false);
    setFeedbackPrompt('');
    setSelectedAffiliates(new Set());
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Affiliates Management</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage all registered affiliates.</p>
      
      <div className="mt-6 space-y-4">
        <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Smart Segments</h3>
            <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="secondary" onClick={() => handleSelectSegment('new')}>New (Last 30d)</Button>
                <Button size="sm" variant="secondary" onClick={() => handleSelectSegment('top')}>Top Performers</Button>
                <Button size="sm" variant="secondary" onClick={() => handleSelectSegment('inactive')}>Inactive (No GMV)</Button>
            </div>
        </div>
        {selectedAffiliates.size > 0 && (
            <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-between shadow">
                <span className="font-semibold text-primary-800 dark:text-primary-200">{selectedAffiliates.size} affiliate(s) selected</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setSelectedAffiliates(new Set())}>Clear Selection</Button>
                  <Button onClick={() => setIsModalOpen(true)}>Request Feedback</Button>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="relative px-6 sm:w-12 sm:px-8">
                    <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                        onChange={handleSelectAll}
                        checked={affiliates.length > 0 && selectedAffiliates.size === affiliates.length}
                    />
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">Display Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">TikTok</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Feedback Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Loading affiliates...</td></tr>
              ) : affiliates.map((affiliate) => {
                const status = affiliate.status || 'Verified';
                return (
                  <tr key={affiliate.uid} className={selectedAffiliates.has(affiliate.uid) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}>
                    <td className="relative px-7 sm:w-12 sm:px-6">
                        <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                            value={affiliate.uid}
                            checked={selectedAffiliates.has(affiliate.uid)}
                            onChange={() => handleSelectOne(affiliate.uid)}
                        />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        {affiliate.displayName}
                        <div className="text-gray-500 dark:text-gray-400">{affiliate.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{affiliate.tiktokUsername}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {affiliate.feedbackRequest && (
                             <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                Requested
                            </span>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        status === 'Verified' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                      <Button size="sm" variant={status === 'Verified' ? 'danger' : 'secondary'} onClick={() => handleToggleStatus(affiliate)}>
                        {status === 'Verified' ? 'Ban' : 'Unban'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleResetPassword(affiliate.uid)}>
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardContent>
                    <h2 className="text-xl font-bold">Request Feedback from {selectedAffiliates.size} Affiliate(s)</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will appear as a high-priority task on their dashboard.</p>
                    <div className="mt-4">
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Use a template</label>
                        <select
                            id="template"
                            onChange={(e) => setFeedbackPrompt(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                        >
                            <option value="">-- Select a template --</option>
                            {FEEDBACK_TEMPLATES.map(t => <option key={t.title} value={t.prompt}>{t.title}</option>)}
                        </select>
                    </div>
                    <div className="mt-4">
                        <Textarea
                            label="Or write a custom prompt"
                            value={feedbackPrompt}
                            onChange={e => setFeedbackPrompt(e.target.value)}
                            rows={5}
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSending}>Cancel</Button>
                        <Button onClick={handleSendFeedbackRequest} disabled={isSending}>
                            {isSending ? 'Sending...' : `Send Request`}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
};

export default AffiliatesManager;