

import { User, Campaign, SampleRequest, SampleRequestStatus, Leaderboard, ResourceArticle, IncentiveCampaign, Ticket, TicketStatus, TicketMessage } from '../types';

export const MOCK_USERS: User[] = [
    { uid: 'admin01', email: 'admin@fyne.com', role: 'Admin' },
    { uid: 'affiliate01', email: 'creator@email.com', role: 'Affiliate', discordUsername: 'creator#1234', tiktokUsername: '@creator', shippingPhoneNumber: '+15551234567', status: 'Verified', cumulativeGMV: 7500.50, approvedVideoCount: 4 },
];

let MOCK_CAMPAIGNS: Campaign[] = [
    { id: 'FYNE-P1', category: 'Skincare', name: 'Glow Up Serum', imageUrl: 'https://picsum.photos/seed/camp1/400/300', productUrl: 'https://partner.com/product/1', shareLink: 'https://fyne.creator.com/share/1', adminOrderLink: 'https://partner.com/admin/order/1', commission: 20, active: true, createdAt: new Date(Date.now() - 86400000 * 1), contentDocUrl: 'https://docs.google.com/document/d/example1/edit' },
    { id: 'FYNE-P2', category: 'Beauty Tech', name: 'Sonic Pore Cleanser', imageUrl: 'https://picsum.photos/seed/camp2/400/300', productUrl: 'https://partner.com/product/2', shareLink: 'https://fyne.creator.com/share/2', adminOrderLink: 'https://partner.com/admin/order/2', commission: 25, active: true, createdAt: new Date(Date.now() - 86400000 * 2), contentDocUrl: 'https://docs.google.com/document/d/example2/edit' },
    { id: 'FYNE-P3', category: 'Skincare', name: 'Hydro-Boost Moisturizer', imageUrl: 'https://picsum.photos/seed/camp3/400/300', productUrl: 'https://partner.com/product/3', shareLink: 'https://fyne.creator.com/share/3', adminOrderLink: 'https://partner.com/admin/order/3', commission: 18, active: true, createdAt: new Date(Date.now() - 86400000 * 3), contentDocUrl: 'https://docs.google.com/document/d/example3/edit' },
    { id: 'FYNE-P4', category: 'Makeup', name: 'Everlasting Liquid Lipstick', imageUrl: 'https://picsum.photos/seed/camp4/400/300', productUrl: 'https://partner.com/product/4', shareLink: 'https://fyne.creator.com/share/4', adminOrderLink: 'https://partner.com/admin/order/4', commission: 15, active: true, createdAt: new Date(Date.now() - 86400000 * 4), contentDocUrl: 'https://docs.google.com/document/d/example4/edit' },
    { id: 'FYNE-P5', category: 'Skincare', name: 'Vitamin C Brightening Oil', imageUrl: 'https://picsum.photos/seed/camp5/400/300', productUrl: 'https://partner.com/product/5', shareLink: 'https://fyne.creator.com/share/5', adminOrderLink: 'https://partner.com/admin/order/5', commission: 22, active: true, createdAt: new Date(Date.now() - 86400000 * 5), contentDocUrl: 'https://docs.google.com/document/d/example5/edit' },
    { id: 'FYNE-P6', category: 'Haircare', name: 'Keratin Repair Shampoo', imageUrl: 'https://picsum.photos/seed/camp6/400/300', productUrl: 'https://partner.com/product/6', shareLink: 'https://fyne.creator.com/share/6', adminOrderLink: 'https://partner.com/admin/order/6', commission: 17, active: true, createdAt: new Date(Date.now() - 86400000 * 6), contentDocUrl: 'https://docs.google.com/document/d/example6/edit' },
    { id: 'FYNE-P7', category: 'Beauty Tech', name: 'LED Therapy Mask', imageUrl: 'https://picsum.photos/seed/camp7/400/300', productUrl: 'https://partner.com/product/7', shareLink: 'https://fyne.creator.com/share/7', adminOrderLink: 'https://partner.com/admin/order/7', commission: 30, active: true, createdAt: new Date(Date.now() - 86400000 * 7), contentDocUrl: 'https://docs.google.com/document/d/example7/edit' },
    { id: 'FYNE-P8', category: 'Skincare', name: 'Overnight Retinol Cream', imageUrl: 'https://picsum.photos/seed/camp8/400/300', productUrl: 'https://partner.com/product/8', shareLink: 'https://fyne.creator.com/share/8', adminOrderLink: 'https://partner.com/admin/order/8', commission: 23, active: true, createdAt: new Date(Date.now() - 86400000 * 8), contentDocUrl: 'https://docs.google.com/document/d/example8/edit' },
    { id: 'FYNE-P9', category: 'Makeup', name: 'Full Coverage Foundation', imageUrl: 'https://picsum.photos/seed/camp9/400/300', productUrl: 'https://partner.com/product/9', shareLink: 'https://fyne.creator.com/share/9', adminOrderLink: 'https://partner.com/admin/order/9', commission: 16, active: true, createdAt: new Date(Date.now() - 86400000 * 9), contentDocUrl: 'https://docs.google.com/document/d/example9/edit' },
    { id: 'FYNE-P10', category: 'Skincare', name: 'Exfoliating Toner', imageUrl: 'https://picsum.photos/seed/camp10/400/300', productUrl: 'https://partner.com/product/10', shareLink: 'https://fyne.creator.com/share/10', adminOrderLink: 'https://partner.com/admin/order/10', commission: 19, active: false, createdAt: new Date(Date.now() - 86400000 * 10), contentDocUrl: 'https://docs.google.com/document/d/example10/edit' },
    { id: 'FYNE-P11', category: 'Fragrance', name: 'Eau de Parfum "Aura"', imageUrl: 'https://picsum.photos/seed/camp11/400/300', productUrl: 'https://partner.com/product/11', shareLink: 'https://fyne.creator.com/share/11', adminOrderLink: 'https://partner.com/admin/order/11', commission: 28, active: true, createdAt: new Date(Date.now() - 86400000 * 11), contentDocUrl: 'https://docs.google.com/document/d/example11/edit' },
    { id: 'FYNE-P12', category: 'Beauty Tech', name: 'Microcurrent Facial Device', imageUrl: 'https://picsum.photos/seed/camp12/400/300', productUrl: 'https://partner.com/product/12', shareLink: 'https://fyne.creator.com/share/12', adminOrderLink: 'https://partner.com/admin/order/12', commission: 35, active: true, createdAt: new Date(Date.now() - 86400000 * 12), contentDocUrl: 'https://docs.google.com/document/d/example12/edit' },
];

let MOCK_SAMPLE_REQUESTS: SampleRequest[] = [
    { id: 'req1', campaignId: 'FYNE-P1', campaignName: 'Glow Up Serum', affiliateId: 'affiliate01', affiliateTiktok: '@creator', fyneVideoUrl: 'https://tiktok.com/video/1', adCode: 'FYNE1', status: 'PendingApproval', createdAt: new Date(Date.now() - 86400000 * 3) },
    // FIX: The `status` property was missing, and 'PendingShowcase' was incorrectly assigned to `adCode`.
    { id: 'req2', campaignId: 'FYNE-P2', campaignName: 'Sonic Pore Cleanser', affiliateId: 'affiliate01', affiliateTiktok: '@creator', fyneVideoUrl: 'https://tiktok.com/video/2', adCode: 'FYNE2', status: 'PendingShowcase', createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 'req3', campaignId: 'FYNE-P3', campaignName: 'Hydro-Boost Moisturizer', affiliateId: 'affiliate01', affiliateTiktok: '@creator', fyneVideoUrl: 'https://tiktok.com/video/3', adCode: 'FYNE3', status: 'PendingOrder', createdAt: new Date(Date.now() - 86400000) },
    { id: 'req4', campaignId: 'FYNE-P4', campaignName: 'Everlasting Liquid Lipstick', affiliateId: 'affiliate01', affiliateTiktok: '@creator', fyneVideoUrl: 'https://tiktok.com/video/4', adCode: 'FYNE4', status: 'Shipped', createdAt: new Date(Date.now() - 86400000 * 5) },
    { id: 'req5', campaignId: 'FYNE-P5', campaignName: 'Vitamin C Brightening Oil', affiliateId: 'affiliate02', affiliateTiktok: '@anothercreator', fyneVideoUrl: 'https://tiktok.com/video/5', adCode: 'FYNE5', status: 'PendingApproval', createdAt: new Date(Date.now() - 86400000 * 1) },
];

let MOCK_LEADERBOARD: Leaderboard = {
    date: new Date(),
    timeframe: `For the 24 hours ending ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}`,
    topAffiliates: [
        { rank: 1, tiktokUsername: '@topcreator', totalGMV: 15000, durationOnTopList: '3 days', itemsSold: 120, productsInShowcase: 50, orders: 100, liveGMV: 8000, videoGMV: 7000, videoViews: 2500000 },
        { rank: 2, tiktokUsername: '@creator', totalGMV: 12500, durationOnTopList: '1 day', itemsSold: 100, productsInShowcase: 40, orders: 80, liveGMV: 6000, videoGMV: 6500, videoViews: 2100000 },
        { rank: 3, tiktokUsername: '@risingstar', totalGMV: 9800, durationOnTopList: '5 days', itemsSold: 80, productsInShowcase: 35, orders: 65, liveGMV: 5000, videoGMV: 4800, videoViews: 1800000 },
    ]
};

let MOCK_RESOURCES: ResourceArticle[] = [
    { id: 'res1', category: 'Daily Content Briefs', title: 'Trending Audio Alert!', content: 'Use this trending sound to boost your video views today. It\'s perfect for showcasing the microneedling tool.' },
    { id: 'res2', category: 'Viral Video Scripts', title: 'The "3 Reasons Why" Script', content: 'Hook: "Here are 3 reasons why I stopped using filters." Body: 1. Fyne gives me confidence... 2. It cleared my acne scars... 3. The glow is real. CTA: "Link in bio to get yours!"' },
    { id: 'res3', category: 'Follower Growth Guides', title: 'Optimizing Your TikTok Bio', content: 'Your bio is your business card. Make sure it clearly states your niche (skincare/beauty), has a call-to-action, and a link to your showcase.' },
];

let MOCK_INCENTIVES: IncentiveCampaign[] = [
    { id: 'inc1', title: 'August GMV Challenge', type: 'GMV Tiers', description: 'Hit new GMV milestones this month to unlock cash bonuses!', rules: ['$1k GMV = $50 bonus', '$5k GMV = $300 bonus', '$10k GMV = $750 bonus'], rewards: 'Cash Bonuses', startDate: new Date('2025-08-01'), endDate: new Date('2025-08-31'), minAffiliates: 20, joinedAffiliates: 15, status: 'Pending' },
    { id: 'inc2', title: 'Weekly Leaderboard Sprint', type: 'Leaderboard Challenge', description: 'Finish in the Top 3 on the weekly GMV leaderboard to win exclusive Fyne merch.', rules: ['Rank 1-3 based on total GMV from Mon-Sun.', 'Ties are broken by conversion rate.'], rewards: 'Exclusive Fyne Skincare Merchandise', startDate: new Date('2025-08-25'), endDate: new Date('2025-08-31'), minAffiliates: 10, joinedAffiliates: 10, status: 'Active' },
    { id: 'inc3', title: 'New Product Launch Race', type: 'Leaderboard Challenge', description: 'Be one of the first 50 creators to join the campaign for our new "Aura" fragrance.', rules: ['Must join before Sept 1st.', 'First 50 get a bonus sample kit.'], rewards: 'Bonus Sample Kit', startDate: new Date('2025-09-01'), endDate: new Date('2025-09-07'), minAffiliates: 50, joinedAffiliates: 4, status: 'Pending' },
];

let MOCK_TICKETS: Ticket[] = [
    { 
        id: 'TKT001', 
        affiliateId: 'affiliate01',
        affiliateTiktok: '@creator',
        subject: 'Account Violation Warning',
        status: 'On-going',
        createdAt: new Date(Date.now() - 86400000 * 2),
        messages: [
            { sender: 'Affiliate', text: 'Hi, I received a warning but I\'m not sure what I did wrong. Can you please clarify?', timestamp: new Date(Date.now() - 86400000 * 2) },
            { sender: 'Admin', text: 'Hi @creator, thanks for reaching out. We flagged a video for using unapproved claims about the Glow Up Serum. We are reviewing the case and will get back to you shortly.', timestamp: new Date(Date.now() - 86400000 * 1) }
        ]
    },
    { 
        id: 'TKT002', 
        affiliateId: 'affiliate01',
        affiliateTiktok: '@creator',
        subject: 'Question about commission',
        status: 'Completed',
        createdAt: new Date(Date.now() - 86400000 * 5),
        messages: [
            { sender: 'Affiliate', text: 'How is commission calculated for bundled products?', timestamp: new Date(Date.now() - 86400000 * 5) },
            { sender: 'Admin', text: 'Commission is calculated on the total sale price after any discounts are applied.', timestamp: new Date(Date.now() - 86400000 * 5) },
            { sender: 'Affiliate', text: 'Got it, thanks!', timestamp: new Date(Date.now() - 86400000 * 5) },
            { sender: 'Admin', text: 'You\'re welcome!', timestamp: new Date(Date.now() - 86400000 * 5) }
        ]
    },
];


// --- API Functions ---

const simulateDelay = <T,>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));

export const fetchCampaigns = () => simulateDelay(MOCK_CAMPAIGNS);
export const fetchSampleRequests = (status?: SampleRequestStatus) => {
    if (status) {
        return simulateDelay(MOCK_SAMPLE_REQUESTS.filter(r => r.status === status));
    }
    return simulateDelay(MOCK_SAMPLE_REQUESTS);
};
export const fetchLeaderboard = () => simulateDelay(MOCK_LEADERBOARD);
export const fetchResources = () => simulateDelay(MOCK_RESOURCES);
export const fetchIncentives = () => simulateDelay(MOCK_INCENTIVES);

export const joinIncentiveCampaign = (campaignId: string): Promise<IncentiveCampaign> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const campaignIndex = MOCK_INCENTIVES.findIndex(c => c.id === campaignId);
            if (campaignIndex !== -1) {
                // In a real app, you'd check if the user has already joined.
                MOCK_INCENTIVES[campaignIndex].joinedAffiliates++;
                if (MOCK_INCENTIVES[campaignIndex].joinedAffiliates >= MOCK_INCENTIVES[campaignIndex].minAffiliates) {
                    MOCK_INCENTIVES[campaignIndex].status = 'Active';
                }
                resolve(JSON.parse(JSON.stringify(MOCK_INCENTIVES[campaignIndex])));
            } else {
                reject(new Error('Incentive campaign not found'));
            }
        }, 300);
    });
};

export const submitSampleRequest = (requestData: Omit<SampleRequest, 'id' | 'status' | 'createdAt' | 'campaignName' | 'affiliateTiktok'>): Promise<{success: boolean; message: string}> => {
    const isDuplicate = MOCK_SAMPLE_REQUESTS.some(r => r.affiliateId === requestData.affiliateId && (r.fyneVideoUrl === requestData.fyneVideoUrl || r.adCode === requestData.adCode));

    if(isDuplicate) {
        return simulateDelay({ success: false, message: 'This video URL or Ad Code has already been submitted.'});
    }

    const campaign = MOCK_CAMPAIGNS.find(c => c.id === requestData.campaignId);
    const affiliate = MOCK_USERS.find(u => u.uid === requestData.affiliateId);

    const newRequest: SampleRequest = {
        id: `req${MOCK_SAMPLE_REQUESTS.length + 1}`,
        ...requestData,
        campaignName: campaign?.name || 'Unknown Campaign',
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        status: 'PendingApproval',
        createdAt: new Date(),
    };
    MOCK_SAMPLE_REQUESTS.unshift(newRequest);
    return simulateDelay({ success: true, message: 'Request submitted successfully! It is now pending admin approval.'});
}

export const updateSampleRequestStatus = (requestId: string, newStatus: SampleRequestStatus): Promise<SampleRequest> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const requestIndex = MOCK_SAMPLE_REQUESTS.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                MOCK_SAMPLE_REQUESTS[requestIndex].status = newStatus;
                resolve(MOCK_SAMPLE_REQUESTS[requestIndex]);
            } else {
                reject(new Error('Sample request not found'));
            }
        }, 300);
    });
};

export const syncFromGoogleSheet = async (url: string): Promise<Campaign[]> => {
    console.log(`Simulating sync from: ${url}`);
    // In a real app, this would fetch and parse the sheet.
    // For this mock, we'll just replace the existing campaigns with a new set.
    const syncedCampaigns: Campaign[] = [
        { id: 'GS-001', name: 'Glow Serum Pro', category: 'Skincare', imageUrl: 'https://picsum.photos/seed/gs001/400/300', productUrl: 'https://partner.com/product/gs-001', shareLink: 'https://fyne.creator.com/share/gs-001', adminOrderLink: 'https://partner.com/admin/order/gs-001', commission: 25, active: true, createdAt: new Date() },
        { id: 'GS-002', name: 'Hydro-Mist 2.0', category: 'Skincare', imageUrl: 'https://picsum.photos/seed/gs002/400/300', productUrl: 'https://partner.com/product/gs-002', shareLink: 'https://fyne.creator.com/share/gs-002', adminOrderLink: 'https://partner.com/admin/order/gs-002', commission: 18, active: true, createdAt: new Date() },
        { id: 'GS-003', name: 'Sonic Facial Brush', category: 'Beauty Tech', imageUrl: 'https://picsum.photos/seed/gs003/400/300', productUrl: 'https://partner.com/product/gs-003', shareLink: 'https://fyne.creator.com/share/gs-003', adminOrderLink: 'https://partner.com/admin/order/gs-003', commission: 20, active: false, createdAt: new Date() },
    ];
    
    MOCK_CAMPAIGNS = syncedCampaigns;
    return simulateDelay(MOCK_CAMPAIGNS);
};

export const syncLeaderboardFromGoogleSheet = async (url: string): Promise<Leaderboard> => {
    console.log(`Simulating leaderboard sync from: ${url}`);
    const syncedLeaderboard: Leaderboard = {
        date: new Date(),
        timeframe: `SYNCHRONIZED: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}`,
        topAffiliates: [
            { rank: 1, tiktokUsername: '@synced_champ', totalGMV: 25000, durationOnTopList: '1 day', itemsSold: 200, productsInShowcase: 60, orders: 150, liveGMV: 10000, videoGMV: 15000, videoViews: 5000000 },
            { rank: 2, tiktokUsername: '@new_challenger', totalGMV: 22000, durationOnTopList: '1 day', itemsSold: 180, productsInShowcase: 55, orders: 130, liveGMV: 9000, videoGMV: 13000, videoViews: 4500000 },
        ]
    };
    MOCK_LEADERBOARD = syncedLeaderboard;
    return simulateDelay(MOCK_LEADERBOARD);
};

export const addResource = async (article: Omit<ResourceArticle, 'id'>): Promise<ResourceArticle> => {
    const newArticle: ResourceArticle = {
        id: `res${Date.now()}`,
        ...article,
    };
    MOCK_RESOURCES.unshift(newArticle);
    return simulateDelay(newArticle);
};

export const updateResource = async (article: ResourceArticle): Promise<ResourceArticle> => {
    const index = MOCK_RESOURCES.findIndex(r => r.id === article.id);
    if (index !== -1) {
        MOCK_RESOURCES[index] = article;
        return simulateDelay(article);
    }
    throw new Error("Resource not found");
};

export const deleteResource = async (articleId: string): Promise<{ success: boolean }> => {
    const index = MOCK_RESOURCES.findIndex(r => r.id === articleId);
    if (index !== -1) {
        MOCK_RESOURCES.splice(index, 1);
        return simulateDelay({ success: true });
    }
    return simulateDelay({ success: false });
};

// --- Ticket API Functions ---

export const fetchTickets = async (affiliateId?: string): Promise<Ticket[]> => {
    const tickets = affiliateId 
        ? MOCK_TICKETS.filter(t => t.affiliateId === affiliateId)
        : MOCK_TICKETS;
    return simulateDelay(JSON.parse(JSON.stringify(tickets))); // Deep copy
};

export const createTicket = async (data: { affiliateId: string; subject: string; message: string }): Promise<Ticket> => {
    const affiliate = MOCK_USERS.find(u => u.uid === data.affiliateId);
    const newTicket: Ticket = {
        id: `TKT${String(MOCK_TICKETS.length + 1).padStart(3, '0')}`,
        affiliateId: data.affiliateId,
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        subject: data.subject,
        status: 'Pending',
        createdAt: new Date(),
        messages: [{
            sender: 'Affiliate',
            text: data.message,
            timestamp: new Date()
        }]
    };
    MOCK_TICKETS.unshift(newTicket);
    return simulateDelay(newTicket);
};

export const addMessageToTicket = async (ticketId: string, message: { sender: 'Admin' | 'Affiliate'; text: string }): Promise<Ticket> => {
    const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    
    const newMessage: TicketMessage = { ...message, timestamp: new Date() };
    ticket.messages.push(newMessage);

    if (message.sender === 'Admin') {
        ticket.status = 'On-going';
    } else {
        ticket.status = 'Pending'; // Re-open ticket if affiliate replies
    }
    
    return simulateDelay(ticket);
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<Ticket> => {
    const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = status;
    return simulateDelay(ticket);
};

// --- Incentive API Functions ---
export const addIncentive = async (incentive: Omit<IncentiveCampaign, 'id' | 'joinedAffiliates' | 'status'>): Promise<IncentiveCampaign> => {
    const newIncentive: IncentiveCampaign = {
        id: `inc${Date.now()}`,
        ...incentive,
        joinedAffiliates: 0,
        status: 'Pending',
    };
    MOCK_INCENTIVES.unshift(newIncentive);
    return simulateDelay(newIncentive);
};

export const updateIncentive = async (incentive: IncentiveCampaign): Promise<IncentiveCampaign> => {
    const index = MOCK_INCENTIVES.findIndex(i => i.id === incentive.id);
    if (index !== -1) {
        const existingIncentive = MOCK_INCENTIVES[index];
        const updatedIncentive = { ...existingIncentive, ...incentive };
        
        // Recalculate status based on new minAffiliates
        if (new Date() > updatedIncentive.endDate) {
            updatedIncentive.status = 'Ended';
        } else if (updatedIncentive.joinedAffiliates >= updatedIncentive.minAffiliates) {
            updatedIncentive.status = 'Active';
        } else {
            updatedIncentive.status = 'Pending';
        }
        
        MOCK_INCENTIVES[index] = updatedIncentive;
        return simulateDelay(updatedIncentive);
    }
    throw new Error("Incentive not found");
};

export const deleteIncentive = async (incentiveId: string): Promise<{ success: boolean }> => {
    const index = MOCK_INCENTIVES.findIndex(i => i.id === incentiveId);
    if (index !== -1) {
        MOCK_INCENTIVES.splice(index, 1);
        return simulateDelay({ success: true });
    }
    return simulateDelay({ success: false });
};