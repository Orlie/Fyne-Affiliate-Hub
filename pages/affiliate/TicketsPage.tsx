

import React, { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTickets, createTicket, addMessageToTicket } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '../../components/icons/Icons';

const TicketsPage: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

    const loadTickets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await fetchTickets(user.uid);
            setTickets(data);
        } catch(error) {
            console.error("Failed to load tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleCreateTicket = async (subject: string, message: string) => {
        if (!user) return;
        await createTicket({ affiliateId: user.uid, subject, message });
        setIsModalOpen(false);
        loadTickets();
    };

    const handleReply = async (ticketId: string, text: string) => {
        if (!text.trim()) return;
        await addMessageToTicket(ticketId, { sender: 'Affiliate', text });
        loadTickets();
    };

    const toggleExpand = (ticketId: string) => {
        setExpandedTicketId(prev => (prev === ticketId ? null : ticketId));
    };

    return (
        <div className="p-4 space-y-4">
             <div className="flex justify-between items-center">
                 <Link to="/profile" className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    Back to Profile
                </Link>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>New Ticket</Button>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">My Support Tickets</h2>

            {loading ? <p className="text-center">Loading tickets...</p> : (
                tickets.length > 0 ? (
                    <div className="space-y-3">
                        {tickets.map(ticket => (
                            <Card key={ticket.id}>
                                <CardContent>
                                    <div className="cursor-pointer" onClick={() => toggleExpand(ticket.id)}>
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-900 dark:text-white">{ticket.subject}</p>
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">{ticket.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ticket.createdAt.toLocaleDateString()}</p>
                                    </div>

                                    {expandedTicketId === ticket.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md">
                                                {ticket.messages.map((msg, index) => (
                                                    <div key={index} className={`flex flex-col ${msg.sender === 'Affiliate' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`p-2 rounded-lg max-w-xs ${msg.sender === 'Affiliate' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                                            <p className="text-sm">{msg.text}</p>
                                                        </div>
                                                         <span className="text-xs text-gray-400 mt-1">{msg.sender} - {msg.timestamp.toLocaleTimeString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <ReplyForm ticketId={ticket.id} onReply={handleReply} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 pt-8">You have no support tickets.</p>
                )
            )}

            {isModalOpen && <NewTicketModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateTicket} />}
        </div>
    );
};


const ReplyForm: React.FC<{ ticketId: string; onReply: (ticketId: string, text: string) => void }> = ({ ticketId, onReply }) => {
    const [replyText, setReplyText] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReply(ticketId, replyText);
        setReplyText('');
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." rows={2} />
            <Button type="submit" size="sm" className="w-full">Send Reply</Button>
        </form>
    );
};

const NewTicketModal: React.FC<{ onClose: () => void, onCreate: (subject: string, message: string) => void }> = ({ onClose, onCreate }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (!subject.trim() || !message.trim()) {
            alert('Please fill out all fields.');
            return;
        }
        onCreate(subject, message);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardContent>
                    <h2 className="text-lg font-bold">Create New Ticket</h2>
                    <div className="mt-4 space-y-4">
                        <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
                        <Textarea label="Message" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit}>Create</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TicketsPage;
