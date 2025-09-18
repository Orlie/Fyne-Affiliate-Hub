import React, { useState, useEffect } from 'react';
import { ResourceArticle } from '../../types';
import { listenToResources } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import RichTextRenderer from '../../components/ui/RichTextRenderer';

type ResourceCategory = 'Daily Content Briefs' | 'Viral Video Scripts' | 'Follower Growth Guides';

const TABS: ResourceCategory[] = ['Daily Content Briefs', 'Viral Video Scripts', 'Follower Growth Guides'];

const ResourcesPage: React.FC = () => {
    const [resources, setResources] = useState<ResourceArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ResourceCategory>('Daily Content Briefs');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToResources((data) => {
            setResources(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredResources = resources.filter(r => r.category === activeTab);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Tips & Tricks</h2>
            <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex flex-wrap gap-x-4 gap-y-2" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            } py-3 px-2 border-b-2 font-medium text-sm`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6 space-y-4">
                {loading ? <p>Loading resources...</p> : 
                    filteredResources.length > 0 ? filteredResources.map(article => (
                        <Card key={article.id}>
                            <CardContent>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{article.title}</h3>
                                <RichTextRenderer content={article.content} className="mt-2" />
                            </CardContent>
                        </Card>
                    )) : <p className="text-center text-gray-500">No resources found in this category.</p>
                }
            </div>
        </div>
    );
};

export default ResourcesPage;
