import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

/**
 * Referral tracking and reward system
 * 
 * How it works:
 * 1. User generates unique referral code (acts://referral/CODE)
 * 2. New user signs up with referral code → both get rewards
 * 3. Rewards are tracked and claimed via Firestore
 */

export interface ReferralCode {
  id: string; // User's UID
  code: string; // Unique shareable code (e.g., "ALICE_X7F2")
  createdAt: Date;
  completedReferrals: number; // How many successful referrals
  pendingRewards: number; // XP waiting to be claimed
  totalRewardsEarned: number; // Lifetime rewards
}

export interface ReferralReward {
  id: string; // Doc ID
  referrerId: string; // Who made the referral
  newUserId: string; // Who signed up
  referralCode: string;
  status: 'pending' | 'claimed' | 'expired'; // pending = waiting for new user to complete 5 tasks
  xpAmount: number;
  createdAt: Date;
  claimedAt?: Date;
  expiresAt: Date; // 90 days after signup
}

export interface ReferralSignup {
  id: string; // New user's UID
  referrerId: string; // Who referred them
  referralCode: string;
  signupDate: Date;
  tasksCompleted: number; // Progress toward reward unlock
  rewardClaimed: boolean;
  newUserXpEarned: number; // XP given to new user
}

/**
 * Generate unique referral code for user
 */
export async function generateReferralCode(userId: string, displayName: string): Promise<string> {
  const db = getFirebaseFirestore();
  
  // Create human-readable code: NAME_HASH (e.g., "ALICE_X7F2")
  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanName = displayName.split(' ')[0].toUpperCase().substring(0, 8);
  const code = `${cleanName}_${hash}`;

  const referralRef = doc(db, 'referrals', userId);
  
  await setDoc(referralRef, {
    code,
    createdAt: Timestamp.now(),
    completedReferrals: 0,
    pendingRewards: 0,
    totalRewardsEarned: 0,
  }, { merge: true });

  return code;
}

/**
 * Get user's referral code (generate if doesn't exist)
 */
export async function getReferralCode(userId: string, displayName: string): Promise<string> {
  const db = getFirebaseFirestore();
  const referralRef = doc(db, 'referrals', userId);
  const referralSnap = await getDoc(referralRef);

  if (referralSnap.exists()) {
    return referralSnap.data().code;
  }

  // Generate new code if doesn't exist
  return generateReferralCode(userId, displayName);
}

/**
 * Get referral stats for user
 */
export async function getReferralStats(userId: string): Promise<ReferralCode | null> {
  const db = getFirebaseFirestore();
  const referralRef = doc(db, 'referrals', userId);
  const referralSnap = await getDoc(referralRef);

  if (!referralSnap.exists()) return null;

  return {
    id: referralSnap.id,
    ...referralSnap.data(),
    createdAt: referralSnap.data().createdAt?.toDate() || new Date(),
  } as ReferralCode;
}

/**
 * Process new user signup with referral code
 * Called when user completes registration
 */
export async function processReferralSignup(
  newUserId: string,
  referralCode: string,
  displayName: string,
): Promise<{ referrerId: string | null; xpReward: number }> {
  const db = getFirebaseFirestore();

  // Find referrer by code
  const referralsRef = collection(db, 'referrals');
  const q = query(referralsRef, where('code', '==', referralCode));
  const results = await getDocs(q);

  if (results.empty) {
    // Invalid referral code
    return { referrerId: null, xpReward: 0 };
  }

  const referrerDoc = results.docs[0];
  const referrerId = referrerDoc.id;

  // Create referral signup record
  const signupRef = doc(db, 'referralSignups', newUserId);
  await setDoc(signupRef, {
    referrerId,
    referralCode,
    signupDate: Timestamp.now(),
    tasksCompleted: 0,
    rewardClaimed: false,
    newUserXpEarned: 0,
  });

  // Create pending reward for referrer
  const rewardsRef = collection(db, 'referralRewards');
  const rewardRef = doc(rewardsRef);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days to claim

  await setDoc(rewardRef, {
    referrerId,
    newUserId,
    referralCode,
    status: 'pending',
    xpAmount: 100, // Base reward (increases based on new user activity)
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  // Give new user welcome bonus XP
  const welcomeXp = 500;
  const userRef = doc(db, 'userInfo', newUserId);
  await updateDoc(userRef, {
    xp: increment(welcomeXp),
  });

  return { referrerId, xpReward: welcomeXp };
}

/**
 * Track task completion for new user (to unlock referrer reward)
 * Called when new user completes a task
 */
export async function trackReferralProgress(newUserId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const signupRef = doc(db, 'referralSignups', newUserId);
  const signupSnap = await getDoc(signupRef);

  if (!signupSnap.exists()) return; // User wasn't referred

  const signup = signupSnap.data();
  const tasksCompleted = (signup.tasksCompleted || 0) + 1;

  // Update signup progress
  await updateDoc(signupRef, { tasksCompleted });

  // When new user completes 5 tasks, unlock referrer reward
  if (tasksCompleted === 5) {
    const referrerId = signup.referrerId;
    const rewardsRef = collection(db, 'referralRewards');
    const q = query(
      rewardsRef,
      where('newUserId', '==', newUserId),
      where('status', '==', 'pending'),
    );
    const rewardSnap = await getDocs(q);

    if (!rewardSnap.empty) {
      const rewardDoc = rewardSnap.docs[0];
      
      // Update reward status and mark as ready to claim
      await updateDoc(rewardDoc.ref, {
        status: 'claimed', // Can be claimed immediately
        claimedAt: Timestamp.now(),
      });

      // Add XP to referrer immediately
      const referrerRef = doc(db, 'userInfo', referrerId);
      await updateDoc(referrerRef, {
        xp: increment(100),
      });

      // Update referral stats
      const referralRef = doc(db, 'referrals', referrerId);
      await updateDoc(referralRef, {
        completedReferrals: increment(1),
        totalRewardsEarned: increment(100),
      });

      // Notify referrer
      const { notifySystem } = await import('@/features/notifications/notificationRepository');
      await notifySystem(
        referrerId,
        `Your friend completed 5 tasks! +100 XP earned`,
      );
    }
  }
}

/**
 * Get all pending referral rewards for user
 */
export async function getPendingReferralRewards(userId: string): Promise<ReferralReward[]> {
  const db = getFirebaseFirestore();
  const rewardsRef = collection(db, 'referralRewards');
  const q = query(
    rewardsRef,
    where('referrerId', '==', userId),
    where('status', '==', 'claimed'),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    claimedAt: doc.data().claimedAt?.toDate(),
    expiresAt: doc.data().expiresAt?.toDate() || new Date(),
  } as ReferralReward));
}

/**
 * Get referral history for user
 */
export async function getReferralHistory(userId: string): Promise<ReferralSignup[]> {
  const db = getFirebaseFirestore();
  const signupsRef = collection(db, 'referralSignups');
  const q = query(signupsRef, where('referrerId', '==', userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    signupDate: doc.data().signupDate?.toDate() || new Date(),
  } as ReferralSignup));
}

/**
 * Generate shareable referral link
 */
export function generateReferralLink(code: string): string {
  // Deep link: acts://referral/CODE
  // Also support web: https://acts.app/join?ref=CODE
  return `https://acts.app/join?ref=${encodeURIComponent(code)}`;
}

/**
 * Parse referral code from deep link
 */
export function parseReferralCodeFromLink(url: string): string | null {
  try {
    // Handle: acts://referral/CODE
    if (url.startsWith('acts://referral/')) {
      return url.replace('acts://referral/', '');
    }
    
    // Handle: https://acts.app/join?ref=CODE
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    return null;
  }
}
