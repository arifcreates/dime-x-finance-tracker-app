import { BusinessProfile } from '../types';

const STORAGE_KEY = 'businessprofile';

export const emptyBusinessProfile: BusinessProfile = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  bankDetails: '',
  defaultNotes: '',
  defaultTaxRate: 0,
  invoicePrefix: 'INV',
  accentColor: '#4F46E5',
  logoDataUrl: '',
};

class BusinessProfileService {
  getProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...emptyBusinessProfile };
      return { ...emptyBusinessProfile, ...JSON.parse(data) };
    } catch (error) {
      console.warn('Ignoring invalid business profile data:', error);
      localStorage.removeItem(STORAGE_KEY);
      return { ...emptyBusinessProfile };
    }
  }

  saveProfile(profile: BusinessProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export const businessProfileService = new BusinessProfileService();
