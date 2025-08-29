

import { 
    User, Campaign, SampleRequest, SampleRequestStatus, Leaderboard, ResourceArticle, 
    IncentiveCampaign, Ticket, TicketStatus
} from '../types';
import { db } from '../firebase';
import { 
    collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, 
    deleteDoc, runTransaction, serverTimestamp, increment, Timestamp, DocumentSnapshot, writeBatch, onSnapshot
} from 'firebase/firestore';


// --- Helper Functions ---
const docToModel = (doc: DocumentSnapshot) => {
    if (!doc.exists()) return null;
    const data = doc.data();
    if (!data) return null;
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

// USERS
export const fetchAllAffiliates = async (): Promise<User[]> => {
    if (!db) return [];
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '==', 'Affiliate'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToModel(doc) as User);
};

export const updateAffiliateStatus = async (userId: string, newStatus: 'Verified' | 'Banned'): Promise<void> => {
    if (!db) return;
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { status: newStatus });
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

/**
 * Internal helper to parse CSV text and sync to Firestore without using AI.
 */
const processCampaignCsv = async (csvText: string): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };

    try {
        const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            return { success: false, message: "CSV is empty or contains only a header." };
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['id', 'name', 'category', 'active', 'commission'];
        for (const rh of requiredHeaders) {
            if (!headers.includes(rh)) {
                return { success: false, message: `Missing required CSV header: ${rh}` };
            }
        }
        
        const campaignsToSync = lines.slice(1).map(line => {
            const values = line.split(',');
            const campaignObj: {[key: string]: string} = {};
            headers.forEach((header, index) => {
                campaignObj[header] = values[index] ? values[index].trim() : '';
            });
            return campaignObj;
        });

        if (campaignsToSync.length === 0) {
            return { success: false, message: "No valid campaign data rows found in the sheet." };
        }

        const batch = writeBatch(db);
        const campaignsCol = collection(db, 'campaigns');

        campaignsToSync.forEach((campaign: any) => {
            if (campaign.id && typeof campaign.id === 'string' && campaign.name) {
                const docRef = doc(campaignsCol, campaign.id.trim());
                
                const commission = parseFloat(campaign.commission);
                const active = campaign.active?.toLowerCase() === 'true';

                const campaignData = {
                    category: campaign.category || 'Uncategorized',
                    name: campaign.name,
                    imageUrl: campaign.imageUrl || '',
                    productUrl: campaign.productUrl || '',
                    shareLink: campaign.shareLink || '',
                    commission: !isNaN(commission) ? commission : 0,
                    active: active,
                    adminOrderLink: campaign.adminOrderLink || '',
                    createdAt: serverTimestamp() // Add or update timestamp on sync
                };
                batch.set(docRef, campaignData, { merge: true });
            }
        });

        await batch.commit();
        return { success: true, message: `Sync successful. ${campaignsToSync.length} campaigns were processed.` };

    } catch (error) {
        console.error("Error during campaign sync:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `An error occurred while syncing campaigns: ${errorMessage}` };
    }
};

/**
 * Fetches data from a public Google Sheet URL, then uses an AI model to parse and sync it.
 * @param sheetUrl The public URL of the Google Sheet.
 */
export const syncCampaignsFromGoogleSheet = async (sheetUrl: string): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    // 1. Extract Sheet ID from URL using a regular expression
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, message: 'Invalid Google Sheet URL. Please provide a valid link.' };
    }
    const sheetId = match[1];

    // 2. Construct the CSV export URL for the first sheet (gid=0)
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    try {
        // 3. Fetch the CSV data from the constructed URL
        const response = await fetch(csvExportUrl);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}. Please ensure your Google Sheet's sharing setting is "Anyone with the link".`);
        }
        const csvText = await response.text();
        
        // 4. Pass the fetched CSV text to the parser and sync function
        return await processCampaignCsv(csvText);

    } catch (error) {
        console.error("Error fetching or syncing from Google Sheet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
        return { success: false, message: `Failed to sync: ${errorMessage}` };
    }
};

export const listenToCampaigns = (onUpdate: (campaigns: Campaign[]) => void): (() => void) => {
    if (!db) {
        onUpdate([]);
        return () => {}; // Return a no-op unsubscribe function
    }
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, where('active', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const campaignsData = snapshot.docs.map(doc => docToModel(doc) as Campaign);
        onUpdate(campaignsData);
    }, (error) => {
        console.error("Error listening to campaigns:", error);
        onUpdate([]); // On error, provide an empty list
    });

    return unsubscribe;
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
export const fetchSampleRequests = async (params?: { status?: SampleRequestStatus; affiliateId?: string }): Promise<SampleRequest[]> => {
    if (!db) return [];
    const constraints = [orderBy('createdAt', 'desc')];
    if (params?.status) {
        constraints.push(where('status', '==', params.status));
    }
    if (params?.affiliateId) {
        constraints.push(where('affiliateId', '==', params.affiliateId));
    }
    
    const q = query(collection(db, 'sampleRequests'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToModel(doc) as SampleRequest);
};

export const submitSampleRequest = async (requestData: Omit<SampleRequest, 'id' | 'status' | 'createdAt' | 'campaignName' | 'affiliateTiktok'>): Promise<{success: boolean; message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
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
        status: 'PendingApproval' as const,
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
    const resourcesCol = collection(db, 'articles');
    const q = query(resourcesCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
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
    const q = query(incentivesCol, orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
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
        
        const campaignData = campaignDoc.data();
        if (!campaignData) {
            throw "Campaign data does not exist!";
        }

        const newJoinedCount = (campaignData.joinedAffiliates || 0) + 1;
        const data: { joinedAffiliates: any; status?: 'Active' } = { 
            joinedAffiliates: increment(1)
        };

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

export const createTicket = async (data: { affiliateId: string; subject: string; message: string }): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    try {
        const affiliateDoc = await getDoc(doc(db, 'users', data.affiliateId));
        const affiliate = affiliateDoc.data();

        const newTicket = {
            affiliateId: data.affiliateId,
            affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
            subject: data.subject,
            status: 'Pending' as const,
            createdAt: serverTimestamp(),
            messages: [{
                sender: 'Affiliate' as const,
                text: data.message,
                timestamp: Timestamp.now()
            }]
        };
        await addDoc(collection(db, 'tickets'), newTicket);
        return { success: true, message: 'Ticket created successfully.' };
    } catch (error) {
        console.error("Error creating ticket:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to create ticket: ${errorMessage}` };
    }
};

export const addMessageToTicket = async (ticketId: string, message: { sender: 'Admin' | 'Affiliate'; text: string }): Promise<void> => {
    if (!db) return;
    const ticketRef = doc(db, "tickets", ticketId);

    await runTransaction(db, async (transaction) => {
        const ticketDoc = await transaction.get(ticketRef);
        if (!ticketDoc.exists()) throw "Ticket not found";
        
        const ticketData = ticketDoc.data();
        if (!ticketData) throw "Ticket data missing";

        const messages = ticketData.messages || [];
        const newMessage = { ...message, timestamp: Timestamp.now() };
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
    await updateDoc(doc(db, 'tickets', ticketId), { status });
};