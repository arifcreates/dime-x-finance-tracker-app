import React, { useState } from 'react';
import { X, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SelectField } from '../Forms/SelectField';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (user: any) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();
  const { setCurrency } = useCurrency();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currency: user?.preferences?.currency || 'USD',
    notifications: user?.preferences?.notifications ?? true,
    biometric: user?.preferences?.biometric ?? false,
    twoFactor: user?.preferences?.twoFactor ?? false,
  });

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      preferences: {
        ...user?.preferences,
        currency: formData.currency,
        theme: theme,
        notifications: formData.notifications,
        biometric: formData.biometric,
        twoFactor: formData.twoFactor,
      }
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    onUpdateUser(updatedUser);
    setCurrency(formData.currency);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    onLogout();
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' },
  ];

  const ToggleSwitch = ({
    checked,
    onClick,
    label,
  }: {
    checked: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border p-0.5 transition-all ${
        checked
          ? 'border-black bg-black dark:border-white dark:bg-white'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      <span
        className={`h-6 w-6 rounded-full shadow-sm transition-transform ${
          checked
            ? 'translate-x-5 bg-white dark:bg-black'
            : 'translate-x-0 bg-gray-300 dark:bg-gray-600'
        }`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-[calc(100%-1rem)] sm:w-full sm:max-w-2xl h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-2 sm:mb-0 border border-black/[0.08] dark:border-gray-800">
        {/* Header */}
        <div className="bg-[#f7f7f4] dark:bg-gray-900 border-b border-black/[0.07] dark:border-gray-800 px-5 py-4 sm:p-6 text-[#111318] dark:text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Settings</h2>
              <p className="text-[#5f6672] dark:text-gray-400 text-sm mt-1 truncate">Manage your account and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#5f6672] dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-[#111318] dark:hover:text-white rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-1/3 bg-[#f7f7f4] dark:bg-gray-800 border-b sm:border-b-0 sm:border-r border-black/[0.07] dark:border-gray-700 px-4 py-3 sm:p-4 overflow-x-auto sm:overflow-y-auto">
            <nav className="grid grid-cols-4 gap-2 sm:block sm:space-y-2 sm:gap-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    title={tab.label}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center sm:justify-start sm:w-full sm:space-x-3 px-3 sm:px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 px-5 py-5 sm:p-6 overflow-y-auto bg-white dark:bg-gray-900">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-[#fbfbf8] dark:bg-gray-800 rounded-xl border border-black/[0.07] dark:border-gray-700">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications on your device</p>
                      </div>
                      <ToggleSwitch
                        label="Toggle push notifications"
                        checked={formData.notifications}
                        onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-[#fbfbf8] dark:bg-gray-800 rounded-xl border border-black/[0.07] dark:border-gray-700">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                      </div>
                      <ToggleSwitch
                        label="Toggle two-factor authentication"
                        checked={formData.twoFactor}
                        onClick={() => setFormData({ ...formData, twoFactor: !formData.twoFactor })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 bg-[#fbfbf8] dark:bg-gray-800 rounded-xl border border-black/[0.07] dark:border-gray-700">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Biometric Login</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use fingerprint or face recognition</p>
                      </div>
                      <ToggleSwitch
                        label="Toggle biometric login"
                        checked={formData.biometric}
                        onClick={() => setFormData({ ...formData, biometric: !formData.biometric })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">App Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Currency
                      </label>
                      <SelectField
                        value={formData.currency}
                        onChange={(value) => setFormData({ ...formData, currency: value })}
                        options={currencyOptions}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <SelectField
                        value={theme}
                        onChange={(value) => setTheme(value as 'light' | 'dark' | 'auto')}
                        options={themeOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/[0.07] dark:border-gray-700 px-5 py-4 sm:p-6 flex-shrink-0 bg-[#fbfbf8] dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr]">
            <button
              onClick={handleLogout}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-black/[0.11] bg-white px-5 py-3 text-sm font-medium text-[#111318] transition-colors hover:bg-[#efefeb] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[48px] rounded-xl border border-black/[0.11] bg-white px-5 py-3 text-sm font-medium text-[#374151] transition-colors hover:bg-[#efefeb] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="min-h-[48px] rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
