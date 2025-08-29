



import React, { useState, useEffect, useCallback } from 'react';
import { IncentiveCampaign } from '../../types';
import { listenToIncentives, addIncentive, updateIncentive, deleteIncentive } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

const IncentivesManager: React.FC = () => {
  const [incentives, setIncentives] = useState<IncentiveCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIncentive, setCurrentIncentive] = useState<Omit<Partial<IncentiveCampaign>, 'rules'> & { rules?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToIncentives((data) => {
        setIncentives(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (incentive?: IncentiveCampaign) => {
    const editableIncentive = incentive 
        ? { ...incentive, rules: incentive.rules.join('\n') } 
        // FIX: Use 'as const' to ensure 'type' is inferred as a literal type, not a string.
        : { type: 'GMV Tiers' as const }; // Default value
    setCurrentIncentive(editableIncentive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentIncentive(null);
  };

  const handleSave = async () => {
    if (!currentIncentive || !currentIncentive.title || !currentIncentive.type || !currentIncentive.minAffiliates) {
      alert('Please fill out Title, Type, and Minimum Affiliates.');
      return;
    }

    const dataToSave = {
        ...currentIncentive,
        rules: typeof currentIncentive.rules === 'string' ? currentIncentive.rules.split('\n').filter(r => r.trim()) : [],
        minAffiliates: Number(currentIncentive.minAffiliates),
        startDate: new Date(currentIncentive.startDate || Date.now()),
        endDate: new Date(currentIncentive.endDate || Date.now()),
        description: currentIncentive.description || '',
        rewards: currentIncentive.rewards || '',
    };

    try {
        if (dataToSave.id) {
          await updateIncentive(dataToSave as IncentiveCampaign);
        } else {
          const { id, joinedAffiliates, status, ...createData } = dataToSave;
          await addIncentive(createData as Omit<IncentiveCampaign, 'id'|'joinedAffiliates'|'status'>);
        }
        // Data reloads via listener
        handleCloseModal();
    } catch (error) {
        console.error("Failed to save incentive:", error);
        alert("Error saving incentive. Please try again.");
    }
  };

  const handleDelete = async (incentiveId: string) => {
    if (window.confirm('Are you sure you want to delete this incentive program?')) {
        try {
          await deleteIncentive(incentiveId);
          // Data reloads via listener
        } catch(error) {
            console.error("Failed to delete incentive:", error);
            alert("Error deleting incentive. Please try again.");
        }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Incentives Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create and manage affiliate incentive programs.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Add New Incentive</Button>
      </div>

      <div className="mt-8">
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {incentives.map(incentive => (
              <Card key={incentive.id}>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{incentive.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {incentive.startDate.toLocaleDateString()} - {incentive.endDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            incentive.status === 'Ended' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            incentive.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>{incentive.status}</span>
                        <Button size="sm" variant="secondary" onClick={() => handleOpenModal(incentive)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(incentive.id)}>Delete</Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-primary-700 dark:text-primary-300">Activation Progress</span>
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{incentive.joinedAffiliates} / {incentive.minAffiliates}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{width: `${(incentive.joinedAffiliates / incentive.minAffiliates) * 100}%`}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && currentIncentive && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-gray-700 flex-shrink-0">{currentIncentive.id ? 'Edit' : 'Add'} Incentive</h2>
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <Input label="Title" value={currentIncentive.title || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, title: e.target.value })} />
              <Textarea label="Description" value={currentIncentive.description || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, description: e.target.value })} rows={3} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select value={currentIncentive.type || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, type: e.target.value as any })} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                    <option value="" disabled>Select a type</option>
                    <option value="GMV Tiers">GMV Tiers</option>
                    <option value="Leaderboard Challenge">Leaderboard Challenge</option>
                </select>
              </div>
              <Textarea label="Rules (one per line)" value={currentIncentive.rules || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, rules: e.target.value })} rows={4} />
              <Input label="Rewards" value={currentIncentive.rewards || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, rewards: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" type="date" value={currentIncentive.startDate ? new Date(currentIncentive.startDate).toISOString().split('T')[0] : ''} onChange={e => setCurrentIncentive({ ...currentIncentive, startDate: e.target.value as any })} />
                  <Input label="End Date" type="date" value={currentIncentive.endDate ? new Date(currentIncentive.endDate).toISOString().split('T')[0] : ''} onChange={e => setCurrentIncentive({ ...currentIncentive, endDate: e.target.value as any })} />
              </div>
              <Input label="Minimum Affiliates Required" type="number" min="1" value={currentIncentive.minAffiliates || ''} onChange={e => setCurrentIncentive({ ...currentIncentive, minAffiliates: parseInt(e.target.value, 10) })} />
            </div>
            <div className="p-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button onClick={handleSave}>Save Incentive</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IncentivesManager;