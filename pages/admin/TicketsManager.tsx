

import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, TicketStatus } from '../../types';
import { listenToTickets, updateTicketStatus, addMessageToTicket } from '../../services/mockApi';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';

const TICKET_STATUSES: TicketStatus[] = ['Pending', 'Received', 'On-going', 'Completed'];

const TicketsManager: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TicketStatus>('Pending');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToTickets((allTickets) => {
        setTickets(allTickets);
        setLoading(false);
        // If a selected ticket is updated, refresh its state in the modal
        if (selectedTicket) {
            const updatedTicket = allTickets.find(t => t.id === selectedTicket.id);
            if(updatedTicket) {
                setSelectedTicket(updatedTicket);
            } else {
                setSelectedTicket(null); // It was deleted or status changed
            }
        }
    });
    return () => unsubscribe();
  }, [selectedTicket]);

  const filteredTickets = tickets.filter(t => t.status === activeTab);

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    // UI will update optimistically via the listener
    await updateTicketStatus(ticketId, status);
  };

  const handleReply = async (ticketId: string, replyText: string) => {
    if (!replyText.trim()) return;
    // UI will update optimistically via the listener
    await addMessageToTicket(ticketId, { sender: 'Admin', text: replyText });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
      
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TICKET_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`${
                activeTab === status
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {status} ({tickets.filter(t => t.status === status).length})
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {loading ? <p>Loading tickets...</p> : (
          filteredTickets.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No tickets in this queue.</p> : (
            <div className="space-y-4">
              {filteredTickets.map(ticket => (
                <Card key={ticket.id}>
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">{ticket.subject}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">From: {ticket.affiliateTiktok} ({ticket.createdAt.toLocaleDateString()})</p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedTicket(ticket)}>View & Reply</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onReply={handleReply}
          onStatusChange={handleUpdateStatus}
        />
      )}
    </div>
  );
};

interface TicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onReply: (ticketId: string, replyText: string) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticket, onClose, onReply, onStatusChange }) => {
    const [replyText, setReplyText] = useState('');

    const handleReplySubmit = () => {
        onReply(ticket.id, replyText);
        setReplyText('');
    };
    
    return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardContent className="flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{ticket.subject}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">From {ticket.affiliateTiktok}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                </div>
                <div className="mt-4">
                    <label htmlFor="status" className="text-sm font-medium">Status:</label>
                    <select
                        id="status"
                        value={ticket.status}
                        onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                        className="ml-2 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-1 text-sm"
                    >
                        {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </CardContent>
            <div className="overflow-y-auto flex-grow p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {ticket.messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'Admin' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{msg.sender} - {msg.timestamp.toLocaleString()}</span>
                    </div>
                ))}
            </div>
            <CardContent className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                    <Textarea 
                        label="Your Reply" 
                        value={replyText} 
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                    />
                    <Button className="w-full" onClick={handleReplySubmit}>Send Reply</Button>
                </div>
            </CardContent>
        </Card>
    </div>
    );
};


export default TicketsManager;