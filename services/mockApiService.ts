const API_BASE_URL = "https://accountant-s-network-2.onrender.com";







import type { Service, Referral, CommissionWallet, Payout, User, AdminStats } from '../types';
import { SERVICES } from '../constants';
import { ReferralStatus } from '../types';

// --- API Functions using real backend ---




export const loginWithGoogle = (idToken: string): Promise<User> => {
  return fetch(`${API_BASE_URL}/login/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),  // Must be this exact key
  }).then(async (res) => {
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google login failed: ${errorText}`);
    }
    return res.json();
  });
};



export const verifyAccount = (token: string): Promise<User> => {
  return fetch(`${API_BASE_URL}/verify/${token}`)
    .then(res => {
      if (!res.ok) throw new Error('Verification failed');
      return res.json();
    });
};

export const getServices = (): Promise<Service[]> => {
  return fetch(`${API_BASE_URL}/services`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    });
};

export const getUserData = (user: User): Promise<{ referrals: Referral[]; wallet: CommissionWallet; payouts: Payout[] }> => {
  return fetch(`${API_BASE_URL}/user/data?userId=${user.id}`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch user data');
      return res.json();
    });
};

export const submitReferral = async (
  clientName: string,
  mobile: string,
  expectedCommission: number
): Promise<Referral> => {
  try {
    const res = await fetch(`${API_BASE_URL}/referral/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName,
        mobile,
        expectedCommission: Number(expectedCommission),
        // userId removed here
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Submission failed: ${errorText || res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Submission failed due to unexpected error');
  }
};

// Admin API

export const getAdminData = (): Promise<{ referrals: Referral[]; stats: AdminStats }> => {
  return fetch(`${API_BASE_URL}/admin/data`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch admin data');
      return res.json();
    });
};

export const updateReferralStatus = (referralId: string, status: ReferralStatus): Promise<Referral> => {
  return fetch(`${API_BASE_URL}/referral/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralId, status }),
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update referral status');
      return res.json();
    });
};

export const setReferralReminder = (referralId: string, reminderDate: string | null, reminderNote: string | null): Promise<Referral> => {
  return fetch(`${API_BASE_URL}/referral/reminder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralId, reminderDate, reminderNote }),
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to set reminder');
      return res.json();
    });
};
export const updateUserProfile = (name: string, email: string, token: string): Promise<User> => {
  return fetch(`${API_BASE_URL}/user/profile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, email }),
  }).then(res => {
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  });
};

// --- Subscription handling example ---

// Internal list of subscription callbacks
const newReferralSubscribers: ((referral: Referral) => void)[] = [];

// Simulated function to trigger callbacks for new referrals (could be called internally on new referral event)
export function triggerNewReferral(referral: Referral) {
  newReferralSubscribers.forEach(callback => callback(referral));
}

// Subscribe to new referrals
export function subscribeToNewReferrals(callback: (referral: Referral) => void): void {
  newReferralSubscribers.push(callback);
}

// Unsubscribe from new referrals
export function unsubscribeFromNewReferrals(callback: (referral: Referral) => void): void {
  const index = newReferralSubscribers.indexOf(callback);
  if (index !== -1) {
    newReferralSubscribers.splice(index, 1);
  }
}
