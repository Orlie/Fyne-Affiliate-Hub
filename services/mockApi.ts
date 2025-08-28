import { 
    User, Campaign, SampleRequest, SampleRequestStatus, Leaderboard, ResourceArticle, 
    IncentiveCampaign, Ticket, TicketStatus, TicketMessage 
} from '../types';
// FIX: Use v8 compat firebase instances and types
import { db, FIREBASE_ENABLED, firebase } from '../firebase';


if (!FIREBASE_ENABLED) {
    console.warn("Firebase is not enabled. All API calls will fail.");
}

// --- Helper Functions ---
// FIX: Use v8 snapshot and timestamp types
const docToModel = (doc: firebase.firestore.DocumentSnapshot) => {
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    const model: any = { id: doc.id, ...data };
    // Convert all Firestore Timestamps to JS Date objects
    for (const key in model) {
        if (model[key] instanceof firebase.firestore.Timestamp) {
            model[key] = model[key].toDate();
        }
    }
    return model;
};

// --- API Functions ---

// USERS
export const fetchAllAffiliates = async (): Promise<User[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const usersCol = db.collection('users');
    const q = usersCol.where('role', '==', 'Affiliate').orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => docToModel(doc) as User);
};

export const resetUserPasswordAdmin = async (userId: string): Promise<void> => {
    alert(`This is a high-security action.
    
For security reasons, resetting another user's password must be done from a trusted backend environment, like a Firebase Cloud Function.

To implement this:
1. Create a new Callable Cloud Function named 'resetPassword'.
2. In the function, use the Firebase Admin SDK's auth().updateUser(uid, { password: newPassword }) method.
3. Call this function from the client.

This ensures your admin credentials are never exposed on the client-side.`);
    console.log(`Placeholder: Would trigger a Cloud Function to reset password for user: ${userId}`);
};


// CAMPAIGNS
export const fetchCampaigns = async (): Promise<Campaign[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const campaignsCol = db.collection('campaigns');
    const q = campaignsCol.where('active', '==', true);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => docToModel(doc) as Campaign);
};

export const fetchAllCampaignsAdmin = async (): Promise<Campaign[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const campaignsCol = db.collection('campaigns');
    const snapshot = await campaignsCol.get();
    return snapshot.docs.map(doc => docToModel(doc) as Campaign);
};

export const fetchCampaignById = async (id: string): Promise<Campaign | null> => {
    if (!db) return null;
    // FIX: Use v8 firestore query syntax
    const docRef = db.collection('campaigns').doc(id);
    const docSnap = await docRef.get();
    return docToModel(docSnap) as Campaign | null;
};

// SAMPLE REQUESTS
export const fetchSampleRequests = async (status?: SampleRequestStatus): Promise<SampleRequest[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    let query: firebase.firestore.Query = db.collection('sampleRequests');
    if (status) {
        query = query.where('status', '==', status);
    }
    const finalQuery = query.orderBy('createdAt', 'desc');
    const snapshot = await finalQuery.get();
    return snapshot.docs.map(doc => docToModel(doc) as SampleRequest);
};

export const submitSampleRequest = async (requestData: Omit<SampleRequest, 'id' | 'status' | 'createdAt' | 'campaignName' | 'affiliateTiktok'>): Promise<{success: boolean; message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    // In Firestore, you'd use security rules or a Cloud Function for uniqueness checks.
    // This client-side check is illustrative.
    const requestsRef = db.collection('sampleRequests');
    // FIX: Use v8 firestore query syntax
    const q = requestsRef.where('affiliateId', '==', requestData.affiliateId);
    const snapshot = await q.get();
    const isDuplicate = snapshot.docs.some(doc => {
        const data = doc.data();
        return data.fyneVideoUrl === requestData.fyneVideoUrl || data.adCode === requestData.adCode;
    });

    if (isDuplicate) {
        return { success: false, message: 'This video URL or Ad Code has already been submitted.'};
    }

    const campaign = await fetchCampaignById(requestData.campaignId);
    // FIX: Use v8 firestore syntax
    const affiliateDoc = await db.collection('users').doc(requestData.affiliateId).get();
    const affiliate = affiliateDoc.data();

    const newRequest = {
        ...requestData,
        campaignName: campaign?.name || 'Unknown Campaign',
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        status: 'PendingApproval' as const,
        // FIX: Use v8 serverTimestamp syntax
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    // FIX: Use v8 firestore syntax
    await requestsRef.add(newRequest);
    return { success: true, message: 'Request submitted successfully! It is now pending admin approval.'};
}

export const updateSampleRequestStatus = async (requestId: string, newStatus: SampleRequestStatus): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    const requestDoc = db.collection('sampleRequests').doc(requestId);
    await requestDoc.update({ status: newStatus });
};

// LEADERBOARD
export const fetchLeaderboard = async (): Promise<Leaderboard | null> => {
    if (!db) return null;
    const today = new Date().toISOString().split('T')[0];
    // FIX: Use v8 firestore syntax
    const leaderboardDoc = db.collection('leaderboard').doc(today);
    const docSnap = await leaderboardDoc.get();
    return docToModel(docSnap) as Leaderboard | null;
};


// RESOURCES
export const fetchResources = async (): Promise<ResourceArticle[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const resourcesCol = db.collection('articles'); // Spec calls it 'articles'
    const snapshot = await resourcesCol.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docToModel(doc) as ResourceArticle);
};

export const addResource = async (article: Omit<ResourceArticle, 'id'>): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 serverTimestamp syntax
    const data = { ...article, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    await db.collection('articles').add(data);
};

export const updateResource = async (article: ResourceArticle): Promise<void> => {
    if (!db) return;
    const { id, ...data } = article;
    // FIX: Use v8 firestore syntax
    await db.collection('articles').doc(id).update(data);
};

export const deleteResource = async (articleId: string): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    await db.collection('articles').doc(articleId).delete();
};

// INCENTIVES
export const fetchIncentives = async (): Promise<IncentiveCampaign[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const incentivesCol = db.collection('incentiveCampaigns');
    const snapshot = await incentivesCol.orderBy('startDate', 'desc').get();
    return snapshot.docs.map(doc => docToModel(doc) as IncentiveCampaign);
};

export const joinIncentiveCampaign = async (campaignId: string): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    const campaignRef = db.collection("incentiveCampaigns").doc(campaignId);
    await db.runTransaction(async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (!campaignDoc.exists) {
            throw "Campaign does not exist!";
        }
        
        const campaignData = campaignDoc.data();
        if (!campaignData) {
            throw "Campaign data does not exist!";
        }

        const newJoinedCount = (campaignData.joinedAffiliates || 0) + 1;
        // FIX: Use v8 increment syntax
        const data = { joinedAffiliates: firebase.firestore.FieldValue.increment(1) } as any;

        if (newJoinedCount >= campaignData.minAffiliates) {
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
        status: 'Pending' as const,
    };
    // FIX: Use v8 firestore syntax
    await db.collection('incentiveCampaigns').add(data);
};

export const updateIncentive = async (incentive: IncentiveCampaign): Promise<void> => {
    if (!db) return;
    const { id, ...data } = incentive;
    // FIX: Use v8 firestore syntax
    await db.collection('incentiveCampaigns').doc(id).update(data as any);
};

export const deleteIncentive = async (incentiveId: string): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    await db.collection('incentiveCampaigns').doc(incentiveId).delete();
};


// TICKETS
export const fetchTickets = async (affiliateId?: string): Promise<Ticket[]> => {
    if (!db) return [];
    // FIX: Use v8 firestore query syntax
    const ticketsCol = db.collection('tickets');
    const query = affiliateId 
        ? ticketsCol.where('affiliateId', '==', affiliateId).orderBy('createdAt', 'desc')
        : ticketsCol.orderBy('createdAt', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map(doc => docToModel(doc) as Ticket);
};

export const createTicket = async (data: { affiliateId: string; subject: string; message: string }): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    const affiliateDoc = await db.collection('users').doc(data.affiliateId).get();
    const affiliate = affiliateDoc.data();

    const newTicket = {
        affiliateId: data.affiliateId,
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        subject: data.subject,
        status: 'Pending' as const,
        // FIX: Use v8 serverTimestamp and Timestamp syntax
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        messages: [{
            sender: 'Affiliate' as const,
            text: data.message,
            timestamp: firebase.firestore.Timestamp.now()
        }]
    };
    // FIX: Use v8 firestore syntax
    await db.collection('tickets').add(newTicket);
};

export const addMessageToTicket = async (ticketId: string, message: { sender: 'Admin' | 'Affiliate'; text: string }): Promise<void> => {
    if (!db) return;
    // FIX: Use v8 firestore syntax
    const ticketRef = db.collection("tickets").doc(ticketId);

    await db.runTransaction(async (transaction) => {
        const ticketDoc = await transaction.get(ticketRef);
        if (!ticketDoc.exists) throw "Ticket not found";
        
        const ticketData = ticketDoc.data();
        if (!ticketData) throw "Ticket data missing";

        const messages = ticketData.messages || [];
        // FIX: Use v8 Timestamp syntax
        const newMessage = { ...message, timestamp: firebase.firestore.Timestamp.now() };
        messages.push(newMessage);
        
        let newStatus = ticketData.status;
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
    // FIX: Use v8 firestore syntax
    await db.collection('tickets').doc(ticketId).update({ status });
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
