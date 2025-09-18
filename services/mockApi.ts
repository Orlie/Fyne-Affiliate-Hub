import { 
    User, Campaign, SampleRequest, SampleRequestStatus, Leaderboard, ResourceArticle, 
    IncentiveCampaign, Ticket, TicketStatus, LeaderboardEntry, PasswordResetRequest, GlobalSettings,
    SurveySubmission, SurveyChoice, Sentiment, SurveyStatus, AdminTask, AdminTaskStatus, DrawWinner,
    ContentReward, ContentSubmission
} from '../types';
import { db } from '../firebase';
// FIX: Updated the `firebase/firestore` import to use the `@firebase/firestore` scope for consistency.
import { 
    collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, 
    deleteDoc, runTransaction, serverTimestamp, increment, Timestamp, DocumentSnapshot, writeBatch, onSnapshot, setDoc, limit, deleteField
} from '@firebase/firestore';


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

const createListener = <T>(q: any, onUpdate: (data: T[]) => void): (() => void) => {
    if (!db) {
        onUpdate([]);
        return () => {};
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => docToModel(doc) as T);
        onUpdate(data);
    }, (error) => {
        console.error("Error listening to collection:", error);
        onUpdate([]);
    });
    return unsubscribe;
};

// FIX: Added a specialized listener for User objects to handle the id -> uid mapping.
const createUserListener = (q: any, onUpdate: (data: User[]) => void): (() => void) => {
    if (!db) {
        onUpdate([]);
        return () => {};
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const model = docToModel(doc);
            if (model) {
                // This is the localized fix: map 'id' to 'uid' for user objects.
                model.uid = model.id;
                delete model.id;
            }
            return model as User;
        });
        onUpdate(data.filter(Boolean)); // Filter out any null models
    }, (error) => {
        console.error("Error listening to user collection:", error);
        onUpdate([]);
    });
    return unsubscribe;
};


// --- API Functions ---

// SETTINGS
export const listenToGlobalSettings = (onUpdate: (settings: GlobalSettings) => void): (() => void) => {
    if (!db) {
        onUpdate({ requireVideoApproval: true }); // Default
        return () => {};
    }
    const settingsDoc = doc(db, 'settings', 'global');
    return onSnapshot(settingsDoc, (docSnap) => {
        if (docSnap.exists()) {
            onUpdate(docSnap.data() as GlobalSettings);
        } else {
            // If settings don't exist, provide a default
            onUpdate({ requireVideoApproval: true });
        }
    }, (error) => {
        console.error("Error listening to settings:", error);
        onUpdate({ requireVideoApproval: true }); // Default on error
    });
};

export const updateGlobalSettings = async (settings: Partial<GlobalSettings>): Promise<void> => {
    if (!db) return;
    const settingsDoc = doc(db, 'settings', 'global');
    await setDoc(settingsDoc, settings, { merge: true });
};

// USERS
export const listenToAllAffiliates = (onUpdate: (users: User[]) => void): (() => void) => {
    const q = query(collection(db, 'users'), where('role', '==', 'Affiliate'), orderBy('createdAt', 'desc'));
    return createUserListener(q, onUpdate);
};

export const listenToPendingOnboardingRequests = (onUpdate: (users: User[]) => void): (() => void) => {
    const q = query(collection(db, 'users'), where('role', '==', 'Affiliate'), where('onboardingStatus', '==', 'pendingAdminAuthorization'), orderBy('createdAt', 'asc'));
    return createUserListener(q, onUpdate);
};

export const updateUserOnboardingStatus = async (userId: string, status: User['onboardingStatus']): Promise<void> => {
    if (!db) return;
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { onboardingStatus: status });
};

export const updateUserProfileFields = async (userId: string, fields: Partial<User>): Promise<void> => {
    if (!db) return;
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, fields);
};

export const updateAffiliateStatus = async (userId: string, newStatus: 'Verified' | 'Banned'): Promise<void> => {
    if (!db) return;
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, { status: newStatus });
};

const getUserByEmail = async (email: string): Promise<User | null> => {
    if (!db) return null;
    const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const model = docToModel(snapshot.docs[0]);
    if (model) {
        model.uid = model.id;
        delete model.id;
    }
    return model as User;
}

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

// PASSWORD RESET
export const requestPasswordReset = async (email: string): Promise<void> => {
    if (!db) return;
    // Check if a pending request already exists for this email to prevent spam
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, where('email', '==', email), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(requestsRef, {
            email,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
    }
    // If a request already exists, we do nothing.
};

export const listenToPasswordResetRequests = (onUpdate: (requests: PasswordResetRequest[]) => void): (() => void) => {
    const q = query(collection(db, 'passwordResetRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    return createListener<PasswordResetRequest>(q, onUpdate);
}

export const resolvePasswordResetRequest = async (requestId: string, userEmail: string, shouldReset: boolean): Promise<void> => {
    if (!db) return;
    if (shouldReset) {
        const user = await getUserByEmail(userEmail);
        if (user) {
            await resetUserPasswordAdmin(user.uid);
        } else {
            console.error(`Could not find user with email ${userEmail} to reset password.`);
            // Still resolve the request below
        }
    }
    // Mark as resolved so it disappears from the admin queue
    const requestDoc = doc(db, 'passwordResetRequests', requestId);
    await updateDoc(requestDoc, { status: 'resolved' });
};


// CAMPAIGNS

/**
 * Parses a single line of a CSV file, respecting quotes and escaped quotes.
 * @param line The string for a single CSV row.
 * @returns An array of strings representing the columns.
 */
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    // This is an escaped quote
                    currentField += '"';
                    i++; // Skip the second quote
                } else {
                    // This is the closing quote for the field
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                // This is the opening quote for the field.
                inQuotes = true;
            } else if (char === ',') {
                // End of a field
                result.push(currentField);
                currentField = '';
            } else {
                // Regular character
                currentField += char;
            }
        }
    }
    // Add the last field
    result.push(currentField);
    return result;
};


const processCampaignCsv = async (csvText: string): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };

    try {
        const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            return { success: false, message: "CSV is empty or contains only a header." };
        }

        const headers = parseCsvLine(lines[0]).map(h => h.trim());
        const requiredHeaders = ['id', 'name', 'category', 'active'];
        for (const rh of requiredHeaders) {
            if (!headers.includes(rh)) {
                return { success: false, message: `Missing required CSV header: ${rh}` };
            }
        }
        
        const campaignsToSync = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            const campaignObj: {[key: string]: string} = {};
            headers.forEach((header, index) => {
                campaignObj[header] = values[index] ? values[index].trim() : '';
            });
            return campaignObj;
        });

        if (campaignsToSync.length === 0) {
            return { success: false, message: "No valid campaign data rows found in the sheet." };
        }
        
        const campaignsCol = collection(db, 'campaigns');
        const existingDocsSnapshot = await getDocs(query(campaignsCol));
        const existingDocs = new Map(existingDocsSnapshot.docs.map(d => [d.id, d.data()]));

        const batch = writeBatch(db);

        campaignsToSync.forEach((campaign: any) => {
            if (campaign.id && typeof campaign.id === 'string' && campaign.name) {
                const docRef = doc(campaignsCol, campaign.id.trim());
                
                const commission = parseFloat(campaign.commission);
                const active = campaign.active?.toLowerCase() === 'true';

                const campaignData: Omit<Campaign, 'id' | 'createdAt'> & {createdAt?: any} = {
                    category: campaign.category || 'Uncategorized',
                    name: campaign.name,
                    imageUrl: campaign.imageUrl || '',
                    productUrl: campaign.productUrl || '',
                    shareLink: campaign.shareLink || '',
                    contentDocUrl: campaign.contentDocUrl || '',
                    commission: !isNaN(commission) ? commission : 0,
                    active: active,
                    orderLink: campaign.orderLink || '',
                };

                // Handle creation date
                if (!existingDocs.has(campaign.id.trim())) {
                    const providedDate = campaign.createdAt ? new Date(campaign.createdAt) : null;
                    if (providedDate && !isNaN(providedDate.getTime())) {
                        campaignData.createdAt = Timestamp.fromDate(providedDate);
                    } else {
                        campaignData.createdAt = serverTimestamp();
                    }
                }

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

export const syncCampaignsFromGoogleSheet = async (sheetUrl: string): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, message: 'Invalid Google Sheet URL. Please provide a valid link.' };
    }
    const sheetId = match[1];

    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    try {
        const response = await fetch(csvExportUrl);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}. Please ensure your Google Sheet's sharing setting is "Anyone with the link".`);
        }
        const csvText = await response.text();
        return await processCampaignCsv(csvText);
    } catch (error) {
        console.error("Error fetching or syncing from Google Sheet:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
        return { success: false, message: `Failed to sync: ${errorMessage}` };
    }
};

export const listenToCampaigns = (onUpdate: (campaigns: Campaign[]) => void): (() => void) => {
    const q = query(collection(db, 'campaigns'), where('active', '==', true));
    return createListener<Campaign>(q, onUpdate);
};

export const listenToAllCampaignsAdmin = (onUpdate: (campaigns: Campaign[]) => void): (() => void) => {
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    return createListener<Campaign>(q, onUpdate);
};

export const fetchCampaignById = async (id: string): Promise<Campaign | null> => {
    if (!db) return null;
    const docRef = doc(db, 'campaigns', id);
    const docSnap = await getDoc(docRef);
    return docToModel(docSnap) as Campaign | null;
};

// SAMPLE REQUESTS
export const listenToSampleRequests = (onUpdate: (requests: SampleRequest[]) => void): (() => void) => {
    const q = query(collection(db, 'sampleRequests'));
    return createListener<SampleRequest>(q, onUpdate);
};


export const listenToSampleRequestsForAffiliate = (affiliateId: string, onUpdate: (requests: SampleRequest[]) => void): (() => void) => {
    const q = query(collection(db, 'sampleRequests'), where('affiliateId', '==', affiliateId));
    return createListener<SampleRequest>(q, onUpdate);
};

export const submitSampleRequest = async (requestData: Omit<SampleRequest, 'id' | 'status' | 'createdAt' | 'campaignName' | 'affiliateTiktok'>): Promise<{success: boolean; message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    const requestsRef = collection(db, 'sampleRequests');
    const q = query(requestsRef, where('affiliateId', '==', requestData.affiliateId), where('campaignId', '==', requestData.campaignId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return { success: false, message: 'You have already submitted a request for this campaign.'};
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

export const createDirectSampleRequest = async (affiliateId: string, campaignId: string): Promise<{success: boolean; message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    const requestsRef = collection(db, 'sampleRequests');
    // Ensure no duplicate request is made
    const q = query(requestsRef, where('affiliateId', '==', affiliateId), where('campaignId', '==', campaignId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return { success: false, message: 'You have already submitted a request for this campaign.'};
    }

    const campaign = await fetchCampaignById(campaignId);
    const affiliateDoc = await getDoc(doc(db, 'users', affiliateId));
    const affiliate = affiliateDoc.data();

    const newRequest = {
        affiliateId,
        campaignId,
        campaignName: campaign?.name || 'Unknown Campaign',
        affiliateTiktok: affiliate?.tiktokUsername || '@unknown',
        fyneVideoUrl: '', // This flow doesn't involve a video
        adCode: '', // Nor an ad code
        status: 'PendingOrder' as const,
        createdAt: serverTimestamp(),
    };
    await addDoc(requestsRef, newRequest);
    return { success: true, message: 'Request created and sent to admin for ordering.'};
}

export const updateSampleRequestStatus = async (requestId: string, newStatus: SampleRequestStatus): Promise<void> => {
    if (!db) return;
    const requestDoc = doc(db, 'sampleRequests', requestId);
    await updateDoc(requestDoc, { status: newStatus });
};

export const affiliateConfirmsShowcase = async (requestId: string): Promise<void> => {
    if (!db) return;
    const requestDoc = doc(db, 'sampleRequests', requestId);
    await updateDoc(requestDoc, { status: 'PendingOrder' });
};


// LEADERBOARD
export const listenToLeaderboard = (onUpdate: (leaderboard: Leaderboard | null) => void): (() => void) => {
    if (!db) {
        onUpdate(null);
        return () => {};
    }
    const today = new Date().toISOString().split('T')[0];
    const leaderboardDoc = doc(db, 'leaderboard', today);
    
    return onSnapshot(leaderboardDoc, (docSnap) => {
        onUpdate(docToModel(docSnap) as Leaderboard | null);
    }, (error) => {
        console.error("Error listening to leaderboard:", error);
        onUpdate(null);
    });
};

export const syncLeaderboardFromGoogleSheet = async (sheetUrl: string): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return { success: false, message: 'Invalid Google Sheet URL.' };
    }
    const sheetId = match[1];
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

    try {
        const response = await fetch(csvExportUrl);
        if (!response.ok) throw new Error(`Failed to fetch sheet. Is it public? (Status: ${response.status})`);
        
        const csvText = await response.text();
        const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return { success: false, message: "CSV is empty." };

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const topAffiliates: LeaderboardEntry[] = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const entry: any = {};
            headers.forEach((header, index) => {
                const numericHeaders = ['rank', 'totalGMV', 'itemsSold', 'productsInShowcase', 'orders', 'liveGMV', 'videoGMV', 'videoViews'];
                if (numericHeaders.includes(header)) {
                    entry[header] = parseFloat(values[index]) || 0;
                } else {
                    entry[header] = values[index] || '';
                }
            });
            return entry as LeaderboardEntry;
        });

        const today = new Date();
        const leaderboardData: Leaderboard = {
            date: today,
            timeframe: `Week of ${today.toLocaleDateString()}`,
            topAffiliates,
        };
        
        const leaderboardDocRef = doc(db, 'leaderboard', today.toISOString().split('T')[0]);
        await setDoc(leaderboardDocRef, leaderboardData);

        return { success: true, message: `Leaderboard synced with ${topAffiliates.length} affiliates.` };
    } catch (error) {
        console.error("Error syncing leaderboard:", error);
        const msg = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Sync failed: ${msg}` };
    }
};


// RESOURCES
export const listenToResources = (onUpdate: (articles: ResourceArticle[]) => void): (() => void) => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    return createListener<ResourceArticle>(q, onUpdate);
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
export const listenToIncentives = (onUpdate: (incentives: IncentiveCampaign[]) => void): (() => void) => {
    const q = query(collection(db, 'incentiveCampaigns'), orderBy('startDate', 'desc'));
    return createListener<IncentiveCampaign>(q, onUpdate);
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
export const listenToTickets = (onUpdate: (tickets: Ticket[]) => void, affiliateId?: string): (() => void) => {
    const ticketsCol = collection(db, 'tickets');
    const q = affiliateId 
        ? query(ticketsCol, where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc'))
        : query(ticketsCol, orderBy('createdAt', 'desc'));
    return createListener<Ticket>(q, onUpdate);
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
                // FIX: Replaced Firestore Timestamp.now() with new Date() to match the 'Date' type in TicketMessage.
                timestamp: new Date()
            }]
        };
        await addDoc(collection(db, 'tickets'), newTicket);
        return { success: true, message: 'Ticket created successfully.' };
// FIX: Explicitly type the caught error to resolve 'Cannot find name' error in the catch block.
    } catch (error: any) {
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
        // FIX: Replaced Firestore Timestamp.now() with new Date() to match the 'Date' type in TicketMessage.
        const newMessage = { ...message, timestamp: new Date() };
        messages.push(newMessage);
        
        let newStatus = ticketData.status;
        if (message.sender === 'Admin' && ticketData.status !== 'Completed') {
            newStatus = 'On-going';
        } else if (message.sender === 'Affiliate' && ticketData.status !== 'Completed') {
            newStatus = 'Pending';
        }

        transaction.update(ticketRef, { messages, status: newStatus });
    });
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, 'tickets', ticketId), { status });
};

// --- Community Engagement API ---

const analyzeSentiment = (text: string): Sentiment => {
    const positiveKeywords = ['love', 'great', 'amazing', 'excellent', 'helpful', 'easy', 'more', 'better'];
    const negativeKeywords = ['hate', 'bad', 'terrible', 'confusing', 'hard', 'issue', 'problem', 'difficult', 'less'];
    const lowerText = text.toLowerCase();
    let score = 0;
    positiveKeywords.forEach(kw => { if (lowerText.includes(kw)) score++; });
    negativeKeywords.forEach(kw => { if (lowerText.includes(kw)) score--; });
    if (score > 0) return 'Positive';
    if (score < 0) return 'Negative';
    return 'Neutral';
};

export const requestFeedbackFromAffiliates = async (userIds: string[], prompt: string): Promise<void> => {
    if (!db || userIds.length === 0) return;
    const batch = writeBatch(db);
    const requestedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(requestedAt.getDate() + 14);

    const feedbackRequestData = {
        prompt,
        requestedAt: Timestamp.fromDate(requestedAt),
        expiresAt: Timestamp.fromDate(expiresAt),
    };

    userIds.forEach(userId => {
        const userDocRef = doc(db, 'users', userId);
        batch.update(userDocRef, { feedbackRequest: feedbackRequestData });
    });

    await batch.commit();
};

export const submitSurvey = async (data: { affiliateId: string; affiliateTiktok: string, choice: SurveyChoice; otherText?: string }, isManualRequestResponse?: boolean): Promise<void> => {
    if (!db) return;
    const submissionData = {
        ...data,
        sentiment: data.otherText ? analyzeSentiment(data.otherText) : 'N/A' as const,
        status: 'New' as const,
        createdAt: serverTimestamp(),
    };
    // Add submission to its own collection
    await addDoc(collection(db, 'surveySubmissions'), submissionData);
    
    // Update the user's profile
    const userDocRef = doc(db, 'users', data.affiliateId);
    if (isManualRequestResponse) {
        // If it's a response to a manual request, clear the request field and update submission time
        // FIX: Replaced serverTimestamp() with new Date() to match the 'Date' type for 'lastSurveySubmittedAt' in the User interface and resolve the type error.
        await updateDoc(userDocRef, { 
            lastSurveySubmittedAt: new Date(),
            feedbackRequest: deleteField() 
        });
    } else {
        // Otherwise, just update the submission time for the weekly survey
        // FIX: Replaced serverTimestamp() with new Date() to match the 'Date' type for 'lastSurveySubmittedAt' in the User interface and resolve the type error.
        await updateDoc(userDocRef, { lastSurveySubmittedAt: new Date() });
    }
};

export const listenToSurveySubmissions = (onUpdate: (submissions: SurveySubmission[]) => void): (() => void) => {
    const q = query(collection(db, 'surveySubmissions'), orderBy('createdAt', 'desc'));
    return createListener<SurveySubmission>(q, onUpdate);
};

export const markSurveyAsActioned = async (submission: SurveySubmission): Promise<void> => {
    if (!db) return;
    const submissionDocRef = doc(db, 'surveySubmissions', submission.id);
    await updateDoc(submissionDocRef, { status: 'Actioned' });
    
    // Auto-generate a "thank you" ticket
    await createTicket({
        affiliateId: submission.affiliateId,
        subject: `Regarding your recent feedback`,
        message: `Hi ${submission.affiliateTiktok},\n\nThank you for your valuable feedback: "${submission.choice}". We have reviewed your suggestion and our team will look into it. We appreciate you helping us improve the Fyne Creator Hub!\n\nBest,\nThe Fyne Team`,
    });
};

export const listenToAdminTasks = (onUpdate: (tasks: AdminTask[]) => void): (() => void) => {
    const q = query(collection(db, 'adminTasks'), orderBy('createdAt', 'desc'));
    return createListener<AdminTask>(q, onUpdate);
};

export const createAdminTask = async (title: string, linkedFeedbackId: string): Promise<void> => {
    if (!db) return;
    await addDoc(collection(db, 'adminTasks'), {
        title,
        linkedFeedbackId,
        status: 'To Do' as const,
        createdAt: serverTimestamp(),
    });
};

export const updateAdminTaskStatus = async (taskId: string, status: AdminTaskStatus): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, 'adminTasks', taskId), { status });
};

export const runWeeklyDraw = async (): Promise<DrawWinner | null> => {
    if (!db) return null;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const q = query(collection(db, 'surveySubmissions'), where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const eligibleParticipants = snapshot.docs.map(d => docToModel(d) as SurveySubmission);
    const winner = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];

    const winnerData: Omit<DrawWinner, 'id'> = {
        affiliateId: winner.affiliateId,
        affiliateTiktok: winner.affiliateTiktok,
        weekOf: new Date(),
    };
    await addDoc(collection(db, 'drawWinners'), winnerData);
    return winnerData as DrawWinner;
};

export const listenToWeeklyDrawWinners = (onUpdate: (winners: DrawWinner[]) => void): (() => void) => {
    const q = query(collection(db, 'drawWinners'), orderBy('weekOf', 'desc'));
    return createListener<DrawWinner>(q, onUpdate);
};

// --- CONTENT REWARDS API ---

export const listenToContentRewards = (onUpdate: (rewards: ContentReward[]) => void): (() => void) => {
    const q = query(collection(db, 'contentRewards'), orderBy('createdAt', 'desc'));
    return createListener<ContentReward>(q, onUpdate);
};

export const fetchContentRewardById = async (id: string): Promise<ContentReward | null> => {
    if (!db) return null;
    const docRef = doc(db, 'contentRewards', id);
    const docSnap = await getDoc(docRef);
    return docToModel(docSnap) as ContentReward | null;
};

export const createContentReward = async (reward: Omit<ContentReward, 'id' | 'createdAt' | 'paidOut'>): Promise<void> => {
    if (!db) return;
    const data = { 
        ...reward, 
        paidOut: 0,
        createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'contentRewards'), data);
};

export const updateContentReward = async (reward: Partial<ContentReward> & { id: string }): Promise<void> => {
    if (!db) return;
    const { id, ...data } = reward;
    const rewardDoc = doc(db, 'contentRewards', id);
    await updateDoc(rewardDoc, data as any);
};

export const submitContentForReward = async (submission: Omit<ContentSubmission, 'id' | 'submittedAt' | 'status' | 'isViewedByAffiliate' | 'reviewedAt' | 'rejectionReason' | 'payoutAmount' | 'trackedViews' | 'originalSubmissionId'>): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: 'Database not connected.' };
    try {
        const data = {
            ...submission,
            status: 'pending_review' as const,
            submittedAt: serverTimestamp(),
            isViewedByAffiliate: true, // The user is viewing it by submitting it
        };
        await addDoc(collection(db, 'contentSubmissions'), data);
        return { success: true, message: 'Your submission has been received!' };
    } catch (error: any) {
        console.error("Error submitting content:", error);
        return { success: false, message: 'There was an error submitting your content.' };
    }
};

export const resubmitContentForReward = async (originalSubmission: ContentSubmission, newData: { videoUrl: string, adCode: string }): Promise<void> => {
    if (!db) return;

    const batch = writeBatch(db);

    const newSubmissionData = {
        rewardId: originalSubmission.rewardId,
        affiliateId: originalSubmission.affiliateId,
        affiliateTiktok: originalSubmission.affiliateTiktok,
        videoUrl: newData.videoUrl,
        adCode: newData.adCode,
        status: 'pending_review' as const,
        submittedAt: serverTimestamp(),
        isViewedByAffiliate: true,
        originalSubmissionId: originalSubmission.id
    };
    
    const newSubRef = doc(collection(db, 'contentSubmissions'));
    batch.set(newSubRef, newSubmissionData);

    const oldSubRef = doc(db, 'contentSubmissions', originalSubmission.id);
    batch.update(oldSubRef, { status: 'resubmitted' });

    await batch.commit();
};


export const listenToSubmissionsForReward = (rewardId: string, onUpdate: (submissions: ContentSubmission[]) => void): (() => void) => {
    const q = query(collection(db, 'contentSubmissions'), where('rewardId', '==', rewardId), orderBy('submittedAt', 'desc'));
    return createListener<ContentSubmission>(q, onUpdate);
};

export const listenToSubmissionsForAffiliate = (affiliateId: string, onUpdate: (submissions: ContentSubmission[]) => void): (() => void) => {
    const q = query(collection(db, 'contentSubmissions'), where('affiliateId', '==', affiliateId), orderBy('submittedAt', 'desc'));
    return createListener<ContentSubmission>(q, onUpdate);
};

export const markSubmissionsAsViewed = async (submissionIds: string[]): Promise<void> => {
    if (!db || submissionIds.length === 0) return;
    const batch = writeBatch(db);
    submissionIds.forEach(id => {
        const subRef = doc(db, 'contentSubmissions', id);
        batch.update(subRef, { isViewedByAffiliate: true });
    });
    await batch.commit();
};

export const reviewSubmission = async (
    submissionId: string, 
    decision: 'approved' | 'rejected', 
    details: { trackedViews?: number; rejectionReason?: string }
): Promise<void> => {
    if (!db) return;

    await runTransaction(db, async (transaction) => {
        const submissionRef = doc(db, 'contentSubmissions', submissionId);
        const submissionDoc = await transaction.get(submissionRef);

        if (!submissionDoc.exists()) {
            throw new Error("Submission does not exist!");
        }

        const submission = submissionDoc.data() as ContentSubmission;
        if (submission.status !== 'pending_review') {
            // Already reviewed, do nothing.
            return;
        }

        const rewardRef = doc(db, 'contentRewards', submission.rewardId);
        const rewardDoc = await transaction.get(rewardRef);

        if (!rewardDoc.exists()) {
            throw new Error("Content Reward program does not exist!");
        }

        const reward = {id: rewardDoc.id, ...rewardDoc.data()} as ContentReward;
        
        const updateData: Partial<ContentSubmission> = {
            status: decision,
            reviewedAt: new Date(),
            isViewedByAffiliate: false, // Set to false so affiliate gets a notification
        };

        if (decision === 'approved') {
            const views = details.trackedViews || 0;
            updateData.trackedViews = views;
            
            let payout = 0;
            const unit = reward.rewardUnit || "per 1000 views";
            if (unit.includes("per 1000 views")) {
                let rate = reward.rewardValue;
                if (reward.tieredRewards && reward.tieredRewards.length > 0) {
                    const applicableTier = [...reward.tieredRewards]
                        .sort((a, b) => b.views - a.views)
                        .find(tier => views >= tier.views);
                    if (applicableTier) {
                        rate = applicableTier.rewardValue;
                    }
                }
                payout = (views / 1000) * rate;
            } else {
                payout = reward.rewardValue;
            }

            updateData.payoutAmount = payout;

            const newPaidOut = reward.paidOut + payout;
            const rewardUpdate: Partial<ContentReward> = { paidOut: newPaidOut };
            if (newPaidOut >= reward.totalBudget) {
                rewardUpdate.status = 'completed';
            }
            transaction.update(rewardRef, rewardUpdate);

        } else { // Rejected
            updateData.rejectionReason = details.rejectionReason || 'No reason provided.';
        }
        
        transaction.update(submissionRef, updateData);
    });
};