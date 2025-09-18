
import React, { useState } from 'react';
import { ContentReward, ContentRewardTier } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { PlusIcon, TrashIcon } from '../../components/icons/Icons';

interface RewardEditorModalProps {
    reward: Partial<ContentReward> | null;
    onClose: () => void;
    onSave: (rewardData: Omit<ContentReward, 'id' | 'createdAt' | 'paidOut'> | (Partial<ContentReward> & { id: string })) => void;
}

const RewardEditorModal: React.FC<RewardEditorModalProps> = ({ reward, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<ContentReward>>({
        title: '',
        description: '',
        imageUrl: '',
        rewardValue: 1.50,
        rewardUnit: 'per 1000 views',
        totalBudget: 10000,
        status: 'active',
        requirements: [''],
        assets: [{ name: '', url: '' }],
        platforms: ['tiktok'],
        leaderboardEnabled: true,
        tieredRewards: [],
        ...reward,
    });
    const [enableTiers, setEnableTiers] = useState(!!reward?.tieredRewards?.length);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
    };

    const handleDynamicListChange = (listName: 'requirements' | 'assets' | 'tieredRewards', index: number, field: string, value: any) => {
        const list = (formData[listName] as any[] || []).slice();
        if (typeof list[index] === 'object') {
            list[index] = { ...list[index], [field]: value };
        } else {
            list[index] = value;
        }
        setFormData(prev => ({ ...prev, [listName]: list }));
    };

    const addDynamicListItem = (listName: 'requirements' | 'assets' | 'tieredRewards') => {
        const list = (formData[listName] as any[] || []).slice();
        const newItem = listName === 'requirements' ? '' : listName === 'assets' ? { name: '', url: '' } : { views: 0, rewardValue: 0 };
        list.push(newItem);
        setFormData(prev => ({ ...prev, [listName]: list }));
    };

    const removeDynamicListItem = (listName: 'requirements' | 'assets' | 'tieredRewards', index: number) => {
        const list = (formData[listName] as any[] || []).slice();
        list.splice(index, 1);
        setFormData(prev => ({ ...prev, [listName]: list }));
    };
    
    const handlePlatformChange = (platform: 'tiktok' | 'instagram' | 'youtube') => {
        const currentPlatforms = formData.platforms || [];
        const newPlatforms = currentPlatforms.includes(platform)
            ? currentPlatforms.filter(p => p !== platform)
            : [...currentPlatforms, platform];
        setFormData(prev => ({ ...prev, platforms: newPlatforms }));
    };

    const handleSaveClick = () => {
        const finalData = {
            ...formData,
            tieredRewards: enableTiers ? formData.tieredRewards : [],
        };
        onSave(finalData as any);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {formData.id ? 'Edit' : 'Create'} Content Reward
                </h2>
                <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <Input name="title" label="Title" value={formData.title} onChange={handleChange} />
                    <Textarea name="description" label="Description" value={formData.description} onChange={handleChange} rows={3} />
                    <Input name="imageUrl" label="Image URL" value={formData.imageUrl} onChange={handleChange} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="totalBudget" label="Total Budget ($)" type="number" value={formData.totalBudget} onChange={handleChange} />
                        <Input name="rewardValue" label="Base Reward Value" type="number" value={formData.rewardValue} onChange={handleChange} />
                    </div>
                     <Input name="rewardUnit" label="Reward Unit (e.g., per 1000 views, per video)" value={formData.rewardUnit} onChange={handleChange} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements</label>
                        {formData.requirements?.map((req, i) => (
                             <div key={i} className="flex items-center gap-2 mb-2">
                                <Input value={req} onChange={e => handleDynamicListChange('requirements', i, '', e.target.value)} placeholder={`Requirement ${i + 1}`} />
                                <Button variant="danger" size="sm" onClick={() => removeDynamicListItem('requirements', i)}><TrashIcon className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => addDynamicListItem('requirements')}><PlusIcon className="h-4 w-4 mr-1" /> Add Requirement</Button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assets (e.g., Google Drive links)</label>
                        {formData.assets?.map((asset, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-center">
                                <Input value={asset.name} onChange={e => handleDynamicListChange('assets', i, 'name', e.target.value)} placeholder="Asset Name" />
                                <div className="flex gap-2">
                                    <Input value={asset.url} onChange={e => handleDynamicListChange('assets', i, 'url', e.target.value)} placeholder="https://..." />
                                    <Button variant="danger" size="sm" onClick={() => removeDynamicListItem('assets', i)}><TrashIcon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => addDynamicListItem('assets')}><PlusIcon className="h-4 w-4 mr-1" /> Add Asset</Button>
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eligible Platforms</label>
                        <div className="flex gap-4">
                            {(['tiktok', 'instagram', 'youtube'] as const).map(p => (
                               <label key={p} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.platforms?.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                                    <span className="capitalize">{p}</span>
                               </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={enableTiers} onChange={(e) => setEnableTiers(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                            <span>Enable Tiered Rewards?</span>
                        </label>
                        {enableTiers && (
                             <div className="mt-2 pl-6">
                                <p className="text-xs text-gray-500 mb-2">Reward value changes when a video hits a certain number of views. Tiers apply from highest to lowest.</p>
                                {formData.tieredRewards?.map((tier, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-center">
                                        <Input type="number" value={tier.views} onChange={e => handleDynamicListChange('tieredRewards', i, 'views', parseInt(e.target.value))} placeholder="Min Views" />
                                        <div className="flex gap-2">
                                            <Input type="number" value={tier.rewardValue} onChange={e => handleDynamicListChange('tieredRewards', i, 'rewardValue', parseFloat(e.target.value))} placeholder="New Reward/1k Views" />
                                            <Button variant="danger" size="sm" onClick={() => removeDynamicListItem('tieredRewards', i)}><TrashIcon className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button size="sm" variant="secondary" onClick={() => addDynamicListItem('tieredRewards')}><PlusIcon className="h-4 w-4 mr-1" /> Add Tier</Button>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.leaderboardEnabled} onChange={(e) => setFormData(prev => ({ ...prev, leaderboardEnabled: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                            <span>Enable Leaderboard for this reward?</span>
                        </label>
                    </div>

                </div>
                <div className="p-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick}>Save Reward</Button>
                </div>
            </Card>
        </div>
    );
};

export default RewardEditorModal;
