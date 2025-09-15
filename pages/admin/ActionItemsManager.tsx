
import React, { useState, useEffect, useMemo } from 'react';
import { AdminTask, AdminTaskStatus } from '../../types';
import { listenToAdminTasks, updateAdminTaskStatus } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STATUS_COLUMNS: AdminTaskStatus[] = ['To Do', 'In Progress', 'Done'];

const ActionItemsManager: React.FC = () => {
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToAdminTasks(data => {
            setTasks(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const tasksByStatus = useMemo(() => {
        return STATUS_COLUMNS.reduce((acc, status) => {
            acc[status] = tasks.filter(task => task.status === status);
            return acc;
        }, {} as Record<AdminTaskStatus, AdminTask[]>);
    }, [tasks]);
    
    const handleStatusChange = async (taskId: string, newStatus: AdminTaskStatus) => {
        await updateAdminTaskStatus(taskId, newStatus);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Action Items</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Track tasks created from affiliate feedback.</p>

            <div className="mt-8">
                {loading ? <p>Loading tasks...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {STATUS_COLUMNS.map(status => (
                            <div key={status} className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
                                <h2 className="font-bold text-lg text-center mb-4">{status} ({tasksByStatus[status].length})</h2>
                                <div className="space-y-4">
                                    {tasksByStatus[status].map(task => (
                                        <Card key={task.id}>
                                            <CardContent>
                                                <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Created: {task.createdAt.toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Feedback ID: <span className="font-mono">{task.linkedFeedbackId}</span>
                                                </p>
                                                <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                                    {status !== 'To Do' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(task.id, 'To Do')}>Move to To Do</Button>}
                                                    {status !== 'In Progress' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(task.id, 'In Progress')}>Move to In Progress</Button>}
                                                    {status !== 'Done' && <Button size="sm" variant="ghost" onClick={() => handleStatusChange(task.id, 'Done')}>Move to Done</Button>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {tasksByStatus[status].length === 0 && <p className="text-center text-sm text-gray-400 dark:text-gray-500">No tasks in this column.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionItemsManager;
