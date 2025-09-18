import React, { useState, useEffect, useMemo } from 'react';
import { ResourceArticle } from '../../types';
import { listenToResources } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import RichTextRenderer from '../../components/ui/RichTextRenderer';
import { ChevronDownIcon } from '../../components/icons/Icons';
import Pagination from '../../components/ui/Pagination';

type ResourceCategory = 'Daily Content Briefs' | 'Viral Video Scripts' | 'Follower Growth Guides';

const TABS: ResourceCategory[] = ['Daily Content Briefs', 'Viral Video Scripts', 'Follower Growth Guides'];
const ITEMS_PER_PAGE = 5;

const ResourcesPage: React.FC = () => {
    const [resources, setResources] = useState<ResourceArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ResourceCategory>('Daily Content Briefs');
    const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToResources((data) => {
            setResources(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredResources = useMemo(() => {
        setCurrentPage(1);
        setExpandedArticleId(null);
        return resources.filter(r => r.category === activeTab);
    }, [resources, activeTab]);

    const paginatedResources = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredResources.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredResources, currentPage]);

    const handleToggle = (articleId: string) => {
        setExpandedArticleId(prevId => (prevId === articleId ? null : articleId));
    };

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
                    paginatedResources.length > 0 ? paginatedResources.map(article => {
                        const isExpanded = expandedArticleId === article.id;
                        return (
                            <Card key={article.id}>
                                <div className="cursor-pointer" onClick={() => handleToggle(article.id)}>
                                    <CardContent className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{article.title}</h3>
                                        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </CardContent>
                                </div>
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                                    <div className="px-4 md:px-6 pb-4">
                                        <RichTextRenderer content={article.content} />
                                    </div>
                                </div>
                            </Card>
                        )
                    }) : <p className="text-center text-gray-500">No resources found in this category.</p>
                }
            </div>
            <Pagination
                currentPage={currentPage}
                totalItems={filteredResources.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default ResourcesPage;
