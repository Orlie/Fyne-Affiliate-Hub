import React, { useState, useEffect } from 'react';
import { ResourceArticle } from '../../types';
import { listenToResources, addResource, updateResource, deleteResource } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import RichTextRenderer from '../../components/ui/RichTextRenderer';

type ResourceCategory = 'Daily Content Briefs' | 'Viral Video Scripts' | 'Follower Growth Guides';
const CATEGORIES: ResourceCategory[] = ['Daily Content Briefs', 'Viral Video Scripts', 'Follower Growth Guides'];

const ResourcesManager: React.FC = () => {
  const [resources, setResources] = useState<ResourceArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<ResourceArticle> | null>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToResources((data) => {
        setResources(data);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (resource?: ResourceArticle) => {
    setCurrentResource(resource || { category: 'Daily Content Briefs', title: '', content: '' });
    setEditorTab('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentResource(null);
  };

  const handleSave = async () => {
    if (!currentResource || !currentResource.title || !currentResource.category || !currentResource.content) {
      alert('Please fill all fields');
      return;
    }
    
    try {
        if (currentResource.id) {
          await updateResource(currentResource as ResourceArticle);
        } else {
          await addResource(currentResource as Omit<ResourceArticle, 'id'>);
        }
    } catch (error) {
        console.error("Failed to save resource:", error);
        alert("Error saving resource. Please try again.");
    }
    
    handleCloseModal();
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
        try {
            await deleteResource(resourceId);
        } catch (error) {
            console.error("Failed to delete resource:", error);
            alert("Error deleting resource. Please try again.");
        }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resources Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Add, edit, or remove articles for affiliates.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Add New Resource</Button>
      </div>

      <div className="mt-8">
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {resources.map(resource => (
              <Card key={resource.id}>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">{resource.category}</span>
                      <h3 className="text-lg font-bold mt-1 text-gray-900 dark:text-white">{resource.title}</h3>
                      <p className="text-sm mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">{resource.content}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => handleOpenModal(resource)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(resource.id)}>Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && currentResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-gray-700">{currentResource.id ? 'Edit' : 'Add'} Resource</h2>
            <div className="p-6 space-y-4 overflow-y-auto">
              <Input
                label="Title"
                value={currentResource.title || ''}
                onChange={(e) => setCurrentResource({ ...currentResource, title: e.target.value })}
              />
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  id="category"
                  value={currentResource.category || ''}
                  onChange={(e) => setCurrentResource({ ...currentResource, category: e.target.value as ResourceCategory })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex border-b border-gray-300 dark:border-gray-600">
                        <button onClick={() => setEditorTab('edit')} className={`px-4 py-2 text-sm font-medium ${editorTab === 'edit' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Edit</button>
                        <button onClick={() => setEditorTab('preview')} className={`px-4 py-2 text-sm font-medium ${editorTab === 'preview' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Preview</button>
                    </div>
                    <div className="p-2">
                        {editorTab === 'edit' ? (
                            <>
                                <Textarea
                                    rows={8}
                                    value={currentResource.content || ''}
                                    onChange={(e) => setCurrentResource({ ...currentResource, content: e.target.value })}
                                    className="border-none focus:ring-0"
                                />
                                <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <b>Formatting:</b> Use `# Heading`, `**bold**`, `*italic*`, `* list item`, and `[link](url)`. Use a blank line for new paragraphs.
                                </div>
                            </>
                        ) : (
                            <div className="min-h-[220px] p-2">
                                <RichTextRenderer content={currentResource.content || 'Start typing in the edit tab to see a preview.'} />
                            </div>
                        )}
                    </div>
                </div>
              </div>

            </div>
            <div className="p-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button onClick={handleSave}>Save Resource</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResourcesManager;
