
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserStatus, PartnerTier } from '../../types';
import { listenToAllUsers, updateUserStatus, addProspect, updateUserProfileFields } from '../../services/mockApi';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import { PlusIcon } from '../../components/icons/Icons';

const STATUS_TABS: (UserStatus | 'All')[] = ['All', 'Prospect', 'Pitched', 'Applied', 'Active', 'Waiting List', 'Inactive', 'Rejected'];

const AffiliatesManager: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<UserStatus | 'All'>('All');
  
  // Modal State
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllUsers((data) => {
        setAllUsers(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    if (activeStatusFilter === 'All') return allUsers;
    return allUsers.filter(u => u.status === activeStatusFilter);
  }, [allUsers, activeStatusFilter]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    await updateUserStatus(userId, status);
  };
  
  const handlePromote = async (user: User) => {
      if (window.confirm(`Are you sure you want to promote ${user.displayName} to Pro Partner?`)) {
          await updateUserProfileFields(user.uid, { partnerTier: 'Pro' });
      }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Creator CRM</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Track, manage, and communicate with your entire creator community.</p>
            </div>
            <Button onClick={() => setIsProspectModalOpen(true)} className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Prospect
            </Button>
        </div>
      
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {STATUS_TABS.map(status => (
                <button
                key={status}
                onClick={() => setActiveStatusFilter(status)}
                className={`${
                    activeStatusFilter === status
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                {status}
                </button>
            ))}
            </nav>
        </div>

      <div className="mt-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Creator</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Socials</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Tier</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Last Contacted</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Loading creators...</td></tr>
              ) : filteredUsers.map((user) => {
                const canBePromoted = (user.cumulativeGMV || 0) >= 5000 && (user.partnerTier === 'Standard' || !user.partnerTier);
                return (
                  <tr key={user.uid}>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900 dark:text-white">{user.displayName || 'N/A'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>TikTok: {user.tiktokUsername || 'N/A'}</div>
                        <div>Discord: {user.discordUsername || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{user.partnerTier || 'Standard'}</td>
                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{user.lastContacted?.toLocaleDateString() || 'N/A'}</td>
                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <select value={user.status} onChange={(e) => handleStatusChange(user.uid, e.target.value as UserStatus)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 pl-2 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500">
                          {STATUS_TABS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                      {canBePromoted && <Button size="sm" onClick={() => handlePromote(user)}>Promote to Pro</Button>}
                      <Button size="sm" variant="secondary" onClick={() => { setSelectedUser(user); setIsManageModalOpen(true); }}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {isProspectModalOpen && <AddProspectModal onClose={() => setIsProspectModalOpen(false)} />}
      {isManageModalOpen && selectedUser && <ManageUserModal user={selectedUser} onClose={() => { setIsManageModalOpen(false); setSelectedUser(null); }} />}
    </div>
  );
};

const AddProspectModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const [formData, setFormData] = useState({ displayName: '', email: '', tiktokUsername: '', discordUsername: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await addProspect(formData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <h2 className="text-xl font-bold">Add New Prospect</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create an internal record for a creator you want to contact.</p>
                        <div className="mt-4 space-y-4">
                            <Input label="Full Name" name="displayName" value={formData.displayName} onChange={handleChange} required />
                            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                            <Input label="TikTok Handle" name="tiktokUsername" value={formData.tiktokUsername} onChange={handleChange} placeholder="@username" required />
                            <Input label="Discord Username" name="discordUsername" value={formData.discordUsername} onChange={handleChange} placeholder="username#1234" />
                        </div>
                    </CardContent>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Prospect'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const ManageUserModal: React.FC<{user: User; onClose: () => void}> = ({ user, onClose }) => {
    const [adminNotes, setAdminNotes] = useState(user.adminNotes || '');
    const [partnerTier, setPartnerTier] = useState(user.partnerTier || 'Standard');
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async () => {
        setIsSaving(true);
        await updateUserProfileFields(user.uid, { adminNotes, partnerTier });
        setIsSaving(false);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardContent>
                    <h2 className="text-xl font-bold">Manage {user.displayName}</h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Partner Tier</label>
                            <select value={partnerTier} onChange={e => setPartnerTier(e.target.value as PartnerTier)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm">
                                <option>Standard</option>
                                <option>Pro</option>
                                <option>Elite</option>
                            </select>
                        </div>
                        <Textarea label="Admin Notes" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={6} />
                    </div>
                </CardContent>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </Card>
        </div>
    );
};

export default AffiliatesManager;