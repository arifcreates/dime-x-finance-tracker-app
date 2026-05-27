import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, ArrowRight, Users } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { supabaseConfigured } from '../../lib/supabase';
import dimeXWordmarkDark from '../../assets/brand/dimex-wordmark-dark.svg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  initialMode?: 'login' | 'register' | 'guest';
}

const createLocalUser = (name: string, email: string) => ({
  id: `local-${Date.now()}`,
  name: name || email.split('@')[0] || 'Dime-x User',
  email,
  avatar: null,
  preferences: {
    theme: 'light',
    currency: 'USD',
    notifications: true,
  },
});

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [initialMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (!supabaseConfigured) {
          const userData = createLocalUser(formData.name, formData.email);
          localStorage.setItem('user', JSON.stringify(userData));
          onLogin(userData);
          onClose();
          return;
        }
        
        const { user } = await supabaseService.signUp(formData.email, formData.password, formData.name);
        
        if (user) {
          const userData = {
            id: user.id,
            name: formData.name,
            email: formData.email,
            avatar: null,
            preferences: {
              theme: 'light',
              currency: 'USD',
              notifications: true,
            }
          };
          
          // Initialize sample data for new users
          await supabaseService.initializeSampleData(user.id);
          
          onLogin(userData);
          onClose();
        }
      } else if (mode === 'login') {
        if (!supabaseConfigured) {
          let userData = createLocalUser('', formData.email);
          try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) userData = JSON.parse(savedUser);
          } catch {
            localStorage.removeItem('user');
          }
          localStorage.setItem('user', JSON.stringify(userData));
          onLogin(userData);
          onClose();
          return;
        }

        const { user } = await supabaseService.signIn(formData.email, formData.password);
        
        if (user) {
          // Get user profile
          const profile = await supabaseService.getProfile(user.id);
          
          const userData = {
            id: user.id,
            name: profile.name,
            email: profile.email,
            avatar: null,
            preferences: profile.preferences || {
              theme: 'light',
              currency: 'USD',
              notifications: true,
            }
          };
          
          onLogin(userData);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const user = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@dime-x.com',
      avatar: null,
      preferences: {
        theme: 'light',
        currency: 'USD',
        notifications: false,
      }
    };

    onLogin(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(17,19,24,0.16)] dark:border-gray-800 dark:bg-gray-900 sm:rounded-3xl">
        {/* Header */}
        <div className="relative flex-shrink-0 border-b border-black/[0.07] bg-[#f7f7f4] p-5 text-[#111318] dark:border-gray-800 dark:bg-gray-900 dark:text-white sm:p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-[#5f6672] transition-colors hover:bg-black/[0.06] hover:text-[#111318] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <img src={dimeXWordmarkDark} alt="Dime-x" className="h-10 w-auto max-w-[170px]" />
            </div>
            <h2 className="mb-1 text-xl font-semibold sm:mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Continue as Guest'}
            </h2>
            <p className="text-sm text-[#5f6672] dark:text-gray-400">
              {mode === 'login' 
                ? 'Sign in to access your dashboard' 
                : mode === 'register'
                ? 'Join Dime-x to manage your finances'
                : 'Try Dime-x without creating an account'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5 dark:bg-gray-900 sm:p-6">
          {mode === 'guest' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-black/[0.08] bg-[#fbfbf8] dark:border-gray-800 dark:bg-gray-800 sm:h-20 sm:w-20">
                <Users className="h-10 w-10 text-[#111318] dark:text-white" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Guest Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Explore Dime-x with empty data. No registration required.
                </p>
              </div>
              <button
                onClick={handleGuestLogin}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#111318] py-3.5 text-base font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-100 sm:py-4"
              >
                <Users className="h-5 w-5" />
                <span>Continue as Guest</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}
              
              {mode === 'register' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-base text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-white sm:py-4"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-base text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-white sm:py-4"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-12 text-base text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-white sm:py-4"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-base text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-white sm:py-4"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-5 flex w-full items-center justify-center space-x-2 rounded-xl bg-black py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 sm:mt-6 sm:py-4"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white dark:border-black border-t-transparent"></div>
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode Toggle */}
          <div className="mt-5 space-y-3 sm:mt-6">
            {mode !== 'guest' && (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                </p>
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-black dark:text-white font-semibold hover:underline mt-1"
                >
                  {mode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            )}
            
            <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => setMode(mode === 'guest' ? 'login' : 'guest')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-sm"
              >
                {mode === 'guest' ? 'Back to Login' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
