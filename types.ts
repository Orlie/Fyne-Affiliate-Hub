

export type UserRole = 'Admin' | 'Affiliate';
export type Theme = 'light' | 'dark';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  username?: string;
  role: UserRole;
  discordUsername?: string;
  tiktokUsername?: string;
  shippingPhoneNumber?: string;
  status: 'Verified' | 'Banned';
  cumulativeGMV?: number;
  approvedVideoCount?: number;
  createdAt?: Date;
  onboardingStatus?: 'needsToJoinCommunity' | 'needsToShowcase' | 'pendingAdminAuthorization' | 'pendingAffiliateAcceptance' | 'completed';
  lastSurveySubmittedAt?: Date;
  lastReminderDismissedAt?: Date;
  feedbackRequest?: {
    prompt: string;
    requestedAt: Date;
    expiresAt: Date;
  };
}

export type SampleRequestStatus = 'PendingApproval' | 'PendingShowcase' | 'PendingOrder' | 'Shipped' | 'Rejected';

export interface Campaign {
  id: string;
  category: string;
  name: string; // from 'title' column
  imageUrl: string; // from 'image' column
  productUrl: string;
  shareLink: string; // for affiliates
  contentDocUrl?: string;
  availabilityStart?: Date;
  availabilityEnd?: Date;
  commission?: number;
  active: boolean;
  orderLink: string; // from 'orderLink' column, for admins only
  createdAt?: Date;
}

export interface SampleRequest {
  id: string;
  campaignId: string;
  campaignName: string;
  affiliateId: string;
  affiliateTiktok: string;
  fyneVideoUrl: string;
  adCode: string;
  status: SampleRequestStatus;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  tiktokUsername: string;
  totalGMV: number;
  durationOnTopList: string;
  itemsSold: number;
  productsInShowcase: number;
  orders: number;
  liveGMV: number;
  videoGMV: number;
  videoViews: number;
}

export interface Leaderboard {
  date: Date;
  timeframe: string;
  topAffiliates: LeaderboardEntry[];
}

export interface ResourceArticle {
  id: string;
  category: 'Daily Content Briefs' | 'Viral Video Scripts' | 'Follower Growth Guides';
  title: string;
  content: string;
}

export interface IncentiveCampaign {
    id: string;
    title: string;
    description: string;
    type: 'GMV Tiers' | 'Leaderboard Challenge';
    rules: string[];
    rewards: string;
    startDate: Date;
    endDate: Date;
    minAffiliates: number;
    joinedAffiliates: number;
    status: 'Pending' | 'Active' | 'Ended';
}

// Ticketing System Types
export type TicketStatus = 'Pending' | 'Received' | 'On-going' | 'Completed';

export interface TicketMessage {
  sender: 'Admin' | 'Affiliate';
  text: string;
  timestamp: Date;
}

export interface Ticket {
  id: string;
  affiliateId: string;
  affiliateTiktok: string;
  subject: string;
  status: TicketStatus;
  createdAt: Date;
  messages: TicketMessage[];
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

export interface GlobalSettings {
  requireVideoApproval: boolean;
}

// --- New Types for Community Engagement ---

export type SurveyChoice = 'More Earnings & Opportunities' | 'Sales Growth Guides' | 'Creator Skills Training' | 'Product Support' | 'Admin Support' | 'Other';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'N/A';
export type SurveyStatus = 'New' | 'Actioned';

export interface SurveySubmission {
    id: string;
    affiliateId: string;
    affiliateTiktok: string;
    choice: SurveyChoice;
    otherText?: string;
    sentiment: Sentiment;
    status: SurveyStatus;
    createdAt: Date;
}

export type AdminTaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface AdminTask {
    id: string;
    title: string;
    status: AdminTaskStatus;
    linkedFeedbackId: string;
    createdAt: Date;
}

export interface DrawWinner {
    id: string;
    affiliateId: string;
    affiliateTiktok: string;
    weekOf: Date;
}