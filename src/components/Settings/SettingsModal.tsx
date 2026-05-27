import React, { useState } from 'react';
import { X, User, Bell, Shield, Palette, Globe, CreditCard, Download, Trash2, LogOut } from 'lucide-react';
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
      <div className="bg-white dark:bg-gray-900 w-[calc(100%-1rem)] sm:w-full sm:max-w-2xl h-[calc(100dvh-var(--mobile-browser-bottom,0px)-0.75rem)] sm:h-auto sm:max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-2 sm:mb-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 dark:from-gray-800 dark:to-gray-900 px-5 py-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold">Settings</h2>
              <p className="text-white/80 text-sm mt-1 truncate">Manage your account and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-1/3 bg-gray-50 dark:bg-gray-800 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 px-4 py-3 sm:p-4 overflow-x-auto sm:overflow-y-auto">
            <nav className="flex sm:block gap-2 sm:space-y-2 sm:gap-0 min-w-max sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex sm:w-full items-center space-x-2 sm:space-x-3 px-4 py-3 rounded-xl text-left transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{tab.label}</span>
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
                    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">App Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Default Currency
                      </label>
                      <SelectField
                        value={formData.currency}
                        onChange={(value) => setFormData({ ...formData, currency: value })}
                        options={currencyOptions}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 sm:p-6 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
            <div className="grid grid-cols-2 gap-3 flex-1">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
