
import React, { useState, useEffect, useMemo } from 'react';
import { SurveySubmission, SurveyChoice, DrawWinner, AdminTask } from '../../types';
import { 
    listenToSurveySubmissions, 
    markSurveyAsActioned, 
    createAdminTask,
    runWeeklyDraw,
    listenToWeeklyDrawWinners
} from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import Textarea from '../../components/ui/Textarea';

const ITEMS_PER_PAGE = 10;
const SURVEY_CHOICES: SurveyChoice[] = ['More Earnings & Opportunities', 'Sales Growth Guides', 'Creator Skills Training', 'Product Support', 'Admin Support', 'Other'];

const FeedbackManager: React.FC = () => {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [winners, setWinners] = useState<DrawWinner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterChoice, setFilterChoice] = useState<SurveyChoice | 'All'>('All');
  
  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [lastWinner, setLastWinner] = useState<DrawWinner | null>(null);


  useEffect(() => {
    setLoading(true);
    const unsubSubmissions = listenToSurveySubmissions(data => {
      setSubmissions(data);
      setLoading(false);
    });
    const unsubWinners = listenToWeeklyDrawWinners(setWinners);

    return () => {
      unsubSubmissions();
      unsubWinners();
    };
  }, []);
  
  const summaryStats = useMemo(() => {
    const total = submissions.length;
    const counts = SURVEY_CHOICES.reduce((acc, choice) => {
        acc[choice] = submissions.filter(s => s.choice === choice).length;
        return acc;
    }, {} as Record<SurveyChoice, number>);
    
    const percentages = SURVEY_CHOICES.reduce((acc, choice) => {
        acc[choice] = total > 0 ? (counts[choice] / total) * 100 : 0;
        return acc;
    }, {} as Record<SurveyChoice, number>);

    return { total, counts, percentages };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    setCurrentPage(1);
    return submissions
      .filter(s => filterChoice === 'All' || s.choice === filterChoice)
      .filter(s => {
          if (!searchTerm) return true;
          const lowerSearch = searchTerm.toLowerCase();
          return s.affiliateTiktok.toLowerCase().includes(lowerSearch) || s.otherText?.toLowerCase().includes(lowerSearch);
      });
  }, [submissions, filterChoice, searchTerm]);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  const handleAction = async (submission: SurveySubmission) => {
    if (window.confirm(`Mark this feedback as actioned and thank ${submission.affiliateTiktok}?`)) {
        await markSurveyAsActioned(submission);
    }
  };

  const handleOpenTaskModal = (submission: SurveySubmission) => {
    setSelectedSubmission(submission);
    setTaskTitle(`Action on feedback from ${submission.affiliateTiktok}`);
    setTaskModalOpen(true);
  };
  
  const handleCreateTask = async () => {
    if (!taskTitle || !selectedSubmission) return;
    await createAdminTask(taskTitle, selectedSubmission.id);
    setTaskModalOpen(false);
    setTaskTitle('');
    setSelectedSubmission(null);
  };

  const handleDrawWinner = async () => {
    const winner = await runWeeklyDraw();
    setLastWinner(winner);
    setWinnerModalOpen(true);
  };
  
  const getSentimentColor = (sentiment: SurveySubmission['sentiment']) => {
      switch(sentiment) {
          case 'Positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
          case 'Negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Affiliate Feedback</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Review, analyze, and act on feedback from your creator community.</p>

      {/* Summary & Visualization */}
      <Card className="mt-8">
        <CardContent>
            <h2 className="text-xl font-bold">Feedback Summary</h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div className="lg:col-span-1 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
                    <p className="text-3xl font-bold">{summaryStats.total}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                </div>
                {SURVEY_CHOICES.map(choice => (
                    <div key={choice} className="lg:col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
                        <p className="text-3xl font-bold">{summaryStats.counts[choice]}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{choice}</p>
                    </div>
                ))}
            </div>
            <div className="mt-6">
                <h3 className="text-md font-semibold mb-2">Feedback Distribution</h3>
                <div className="flex items-end h-32 gap-2">
                    {SURVEY_CHOICES.map(choice => (
                        <div key={choice} className="flex-1 flex flex-col items-center" title={`${choice}: ${summaryStats.percentages[choice].toFixed(1)}%`}>
                            <div className="w-full bg-primary-500 rounded-t-md" style={{ height: `${summaryStats.percentages[choice]}%`}}></div>
                            <p className="text-xs text-center mt-1 transform -rotate-45 whitespace-nowrap">{choice}</p>
                        </div>
                    ))}
                </div>
            </div>
        </CardContent>
      </Card>
      
      {/* Gamification Hub */}
      <Card className="mt-8">
        <CardContent>
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Weekly Feedback Draw</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reward affiliates for their valuable input.</p>
                </div>
                <Button onClick={handleDrawWinner}>Draw This Week's Winner</Button>
            </div>
            {winners.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-semibold text-sm">Recent Winners:</h3>
                    <ul className="text-xs list-disc list-inside">
                        {winners.slice(0, 3).map(w => <li key={w.id}>{w.affiliateTiktok} (Week of {w.weekOf.toLocaleDateString()})</li>)}
                    </ul>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Detailed Submissions Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold">All Submissions</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input placeholder="Search by TikTok or feedback..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             <select value={filterChoice} onChange={e => setFilterChoice(e.target.value as any)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="All">All Categories</option>
                {SURVEY_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
           <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
               <thead className="bg-gray-50 dark:bg-gray-800">
                   <tr>
                       <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Affiliate</th>
                       <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Choice</th>
                       <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Feedback</th>
                       <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Sentiment</th>
                       <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                       <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                   {loading ? (
                        <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                   ) : paginatedSubmissions.map(s => (
                       <tr key={s.id}>
                           <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">{s.affiliateTiktok}<br/><span className="text-xs text-gray-500">{s.createdAt.toLocaleDateString()}</span></td>
                           <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{s.choice}</td>
                           <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate">{s.otherText || 'N/A'}</td>
                           <td className="px-3 py-4 text-sm"><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getSentimentColor(s.sentiment)}`}>{s.sentiment}</span></td>
                           <td className="px-3 py-4 text-sm"><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${s.status === 'New' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>{s.status}</span></td>
                           <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                               {s.status === 'New' && <Button size="sm" variant="secondary" onClick={() => handleAction(s)}>Actioned & Thank</Button>}
                               <Button size="sm" variant="ghost" onClick={() => handleOpenTaskModal(s)}>Create Task</Button>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
        </div>
        <Pagination currentPage={currentPage} totalItems={filteredSubmissions.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {/* Modals */}
      {taskModalOpen && selectedSubmission && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardContent>
                    <h2 className="text-xl font-bold">Create Task from Feedback</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Feedback from: {selectedSubmission.affiliateTiktok}</p>
                    <blockquote className="mt-2 p-2 border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm">
                        "{selectedSubmission.choice}" - {selectedSubmission.otherText || ''}
                    </blockquote>
                    <div className="mt-4">
                        <Textarea label="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                    </div>
                </CardContent>
            </Card>
         </div>
      )}
      {winnerModalOpen && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardContent>
                    <h2 className="text-2xl font-bold">🎉 Weekly Draw Winner! 🎉</h2>
                    {lastWinner ? (
                        <>
                            <p className="mt-4 text-lg">Congratulations to</p>
                            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 my-2">{lastWinner.affiliateTiktok}</p>
                            <p>They've won this week's $10 gift card!</p>
                        </>
                    ) : (
                        <p className="mt-4 text-lg">No eligible participants in the last week.</p>
                    )}
                     <Button onClick={() => setWinnerModalOpen(false)} className="mt-6 w-full">Close</Button>
                </CardContent>
            </Card>
         </div>
      )}

    </div>
  );
};

export default FeedbackManager;
