import { BusinessProfile } from '../types';
import { supabaseService } from './supabaseService';

export const emptyBusinessProfile: BusinessProfile = {
  companyName: '', companyEmail: '', companyPhone: '', companyAddress: '', bankDetails: '',
  defaultNotes: '', defaultTaxRate: 0, invoicePrefix: 'INV', accentColor: '#4F46E5', logoDataUrl: '',
};
class BusinessProfileService {
  private userId: string | null = null;
  private profile = { ...emptyBusinessProfile };
  private currency = 'USD';
  setCurrentUserId(id: string | null) { this.userId = id; this.profile = { ...emptyBusinessProfile }; this.currency = 'USD'; }
  hydrate(profile: BusinessProfile | undefined, currency: string) { this.profile = { ...emptyBusinessProfile, ...profile }; this.currency = currency; }
  getReportCurrency() { return this.currency; }
  setReportCurrency(currency: string) { this.currency = currency; }
  getProfile(): BusinessProfile {
    if (this.userId) return { ...this.profile };
    try { return { ...emptyBusinessProfile, ...JSON.parse(localStorage.getItem('dimex:guest:businessprofile') || '{}') }; }
    catch { return { ...emptyBusinessProfile }; }
  }
  async saveProfile(profile: BusinessProfile) {
    if (this.userId) await supabaseService.updateProfile(this.userId, { business_profile: profile });
    else localStorage.setItem('dimex:guest:businessprofile', JSON.stringify(profile));
    this.profile = { ...profile };
  }
}
export const businessProfileService = new BusinessProfileService();
