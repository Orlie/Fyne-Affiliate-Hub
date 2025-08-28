
import { 
    User, Campaign, SampleRequest, SampleRequestStatus, Leaderboard, ResourceArticle, 
    IncentiveCampaign, Ticket, TicketStatus, TicketMessage 
} from '../types';
import { db, FIREBASE_ENABLED } from '../firebase';
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, 
    serverTimestamp, runTransaction, increment, orderBy, Timestamp, writeBatch
} from 'firebase/firestore';

if (!FIREBASE_ENABLED) {
    console.warn("Firebase is not enabled. All API calls will fail.");
}

// --- Helper Functions ---
const docToModel = (doc: any) => {
    if (!doc.exists()) return null;
    const data = doc.data();
    const model: any = { id: doc.id, ...data };
    // Convert all Firestore Timestamps to JS Date objects
    for (const key in model) {
        if (model[key] instanceof Timestamp) {
            model[key] = model[key].toDate();
        }
    }
    return model;
};

// --- API Functions ---

// CAMPAIGNS
export const fetchCampaigns = async (): Promise<Campaign[]> => {
    if (!db) return [];
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToModel(doc) as Campaign);
};

export const fetchAllCampaignsAdmin = async (): Promise<Campaign[]> => {
    if (!db) return [];
    const campaignsCol = collection(db, 'campaigns');
    const snapshot = await getDocs(campaignsCol);
    return snapshot.docs.map(doc => docToModel(doc) as Campaign);
};

export const fetchCampaignById = async (id: string): Promise<Campaign | null> => {
    if (!db) return null;
    const docRef = doc(db, 'campaigns', id);
    const docSnap = await getDoc(docRef);
    return docToModel(docSnap) as Campaign | null;
};

// SAMPLE REQUESTS
export const fetchSampleRequests = async (status?: SampleRequestStatus): Promise<SampleRequest[]> => {
    if (!db) return [];
    const requestsCol = collection(db, 'sampleRequests');
    const q = status 
        ? query(requestsCol, where('status', '==', status), orderBy('createdAt', 'desc'))
        : query(requestsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToModel(doc) as SampleRequest);
};

export const submitSampleRequest = async (requestData: Omit<SampleRequest, 'id' | 'status' | 'createdAt' | 'campaignName' | 'affiliateTiktok'>): Promise<{success: boolean; message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    // In Firestore, you'd use security rules or a Cloud Function for uniqueness checks.
    // This client-side check is illustrative.
    const requestsRef = collection(db, 'sampleRequests');
    const q = query(requestsRef, where('affiliateId', '==', requestData.affiliateId));
    const snapshot = await getDocs(q);
    const isDuplicate = snapshot.docs.some(doc => {
        const data = doc.data();
        return data.fyneVideoUrl === requestData.fyneVideoUrl || data.adCode === requestData.adCode;
    });

    if (isDuplicate) {
        return { success: false, message: 'This video URL or Ad Code has already been submitted.'};
    }

    const campaign = await fetchCampaignById(requestData.campaignId);
    const affiliateDoc = await getDoc(doc(db, 'users', requestData.affiliateId));
    const affiliate = affiliateDoc.data();

    const newRequest = {
        ...requestData,
        campaignName: campaign?.name || 'Unknown Campaign',
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        status: 'PendingApproval',
        createdAt: serverTimestamp(),
    };
    await addDoc(requestsRef, newRequest);
    return { success: true, message: 'Request submitted successfully! It is now pending admin approval.'};
}

export const updateSampleRequestStatus = async (requestId: string, newStatus: SampleRequestStatus): Promise<void> => {
    if (!db) return;
    const requestDoc = doc(db, 'sampleRequests', requestId);
    await updateDoc(requestDoc, { status: newStatus });
};

// LEADERBOARD
export const fetchLeaderboard = async (): Promise<Leaderboard | null> => {
    if (!db) return null;
    const today = new Date().toISOString().split('T')[0];
    const leaderboardDoc = doc(db, 'leaderboard', today);
    const docSnap = await getDoc(leaderboardDoc);
    return docToModel(docSnap) as Leaderboard | null;
};


// RESOURCES
export const fetchResources = async (): Promise<ResourceArticle[]> => {
    if (!db) return [];
    const resourcesCol = collection(db, 'articles'); // Spec calls it 'articles'
    const snapshot = await getDocs(query(resourcesCol, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => docToModel(doc) as ResourceArticle);
};

export const addResource = async (article: Omit<ResourceArticle, 'id'>): Promise<void> => {
    if (!db) return;
    const data = { ...article, createdAt: serverTimestamp() };
    await addDoc(collection(db, 'articles'), data);
};

export const updateResource = async (article: ResourceArticle): Promise<void> => {
    if (!db) return;
    const { id, ...data } = article;
    await updateDoc(doc(db, 'articles', id), data);
};

export const deleteResource = async (articleId: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, 'articles', articleId));
};

// INCENTIVES
export const fetchIncentives = async (): Promise<IncentiveCampaign[]> => {
    if (!db) return [];
    const incentivesCol = collection(db, 'incentiveCampaigns');
    const snapshot = await getDocs(query(incentivesCol, orderBy('startDate', 'desc')));
    return snapshot.docs.map(doc => docToModel(doc) as IncentiveCampaign);
};

export const joinIncentiveCampaign = async (campaignId: string): Promise<void> => {
    if (!db) return;
    const campaignRef = doc(db, "incentiveCampaigns", campaignId);
    await runTransaction(db, async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (!campaignDoc.exists()) {
            throw "Campaign does not exist!";
        }
        
        const newJoinedCount = (campaignDoc.data().joinedAffiliates || 0) + 1;
        const data = { joinedAffiliates: increment(1) } as any;

        if (newJoinedCount >= campaignDoc.data().minAffiliates) {
            data.status = 'Active';
        }
        transaction.update(campaignRef, data);
    });
};

export const addIncentive = async (incentive: Omit<IncentiveCampaign, 'id' | 'joinedAffiliates' | 'status'>): Promise<void> => {
    if (!db) return;
    const data = { 
        ...incentive, 
        joinedAffiliates: 0,
        status: 'Pending',
    };
    await addDoc(collection(db, 'incentiveCampaigns'), data);
};

export const updateIncentive = async (incentive: IncentiveCampaign): Promise<void> => {
    if (!db) return;
    const { id, ...data } = incentive;
    await updateDoc(doc(db, 'incentiveCampaigns', id), data as any);
};

export const deleteIncentive = async (incentiveId: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, 'incentiveCampaigns', incentiveId));
};


// TICKETS
export const fetchTickets = async (affiliateId?: string): Promise<Ticket[]> => {
    if (!db) return [];
    const ticketsCol = collection(db, 'tickets');
    const q = affiliateId 
        ? query(ticketsCol, where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc'))
        : query(ticketsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToModel(doc) as Ticket);
};

export const createTicket = async (data: { affiliateId: string; subject: string; message: string }): Promise<void> => {
    if (!db) return;
    const affiliateDoc = await getDoc(doc(db, 'users', data.affiliateId));
    const affiliate = affiliateDoc.data();

    const newTicket = {
        affiliateId: data.affiliateId,
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        subject: data.subject,
        status: 'Pending',
        createdAt: serverTimestamp(),
        messages: [{
            sender: 'Affiliate',
            text: data.message,
            timestamp: Timestamp.now()
        }]
    };
    await addDoc(collection(db, 'tickets'), newTicket);
};

export const addMessageToTicket = async (ticketId: string, message: { sender: 'Admin' | 'Affiliate'; text: string }): Promise<void> => {
    if (!db) return;
    const ticketRef = doc(db, "tickets", ticketId);

    await runTransaction(db, async (transaction) => {
        const ticketDoc = await transaction.get(ticketRef);
        if (!ticketDoc.exists()) throw "Ticket not found";

        const messages = ticketDoc.data().messages || [];
        const newMessage = { ...message, timestamp: Timestamp.now() };
        messages.push(newMessage);
        
        let newStatus = ticketDoc.data().status;
        if (message.sender === 'Admin') {
            newStatus = 'On-going';
        } else {
            newStatus = 'Pending';
        }

        transaction.update(ticketRef, { messages, status: newStatus });
    });
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, 'tickets', ticketId), { status });
};


// --- GOOGLE SHEET SYNC (PLACEHOLDERS) ---

export const syncFromGoogleSheet = async (url: string): Promise<Campaign[]> => {
    console.log(`Syncing from: ${url}`);
    alert("This feature requires a backend Cloud Function to securely fetch and parse the Google Sheet. This is a placeholder for the UI flow.");
    // In a real app, this would trigger a Cloud Function that:
    // 1. Fetches the Google Sheet data.
    // 2. Parses the rows into Campaign objects.
    // 3. Uses the Firebase Admin SDK to perform a batch write to the 'campaigns' collection.
    // 4. Returns the result to the client.
    // For now, we return an empty array to simulate a non-functional call.
    return Promise.resolve([]);
};

export const syncLeaderboardFromGoogleSheet = async (url: string): Promise<Leaderboard | null> => {
    console.log(`Syncing leaderboard from: ${url}`);
    alert("This feature requires a backend Cloud Function.");
    return Promise.resolve(null);
};
