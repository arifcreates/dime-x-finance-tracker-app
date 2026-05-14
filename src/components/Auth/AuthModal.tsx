import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, Users } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

// Custom star logo component using the provided SVG - bigger size
const DimeXLogo: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <g>
      <polygon points="85.1,50 72.3,72.3 59.4,50 72.3,27.7" />
      <polygon points="14.9,50 27.7,72.3 40.6,50 27.7,27.7" />
      <polygon points="50,40.6 72.3,27.7 50,14.9 27.7,27.7" />
      <polygon points="50,85.1 72.3,72.3 50,59.4 27.7,72.3" />
    </g>
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Simulate authentication
    const user = {
      id: '1',
      name: formData.name || 'John Doe',
      email: formData.email,
      avatar: null,
      preferences: {
        theme: 'light',
        currency: 'USD',
        notifications: true,
      }
    };

    localStorage.setItem('user', JSON.stringify(user));
    onLogin(user);
    onClose();
  };

  const handleGuestLogin = () => {
    const guestUser = {
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

    localStorage.setItem('user', JSON.stringify(guestUser));
    onLogin(guestUser);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-black to-gray-800 dark:from-gray-800 dark:to-gray-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DimeXLogo className="h-12 w-12 text-black dark:text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Continue as Guest'}
            </h2>
            <p className="text-white/80 text-sm">
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
        <div className="p-6">
          {mode === 'guest' ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Guest Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Explore Dime-x with empty data. No registration required.
                </p>
              </div>
              <button
                onClick={handleGuestLogin}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Continue as Guest</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 mt-6"
              >
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {/* Mode Toggle */}
          <div className="mt-6 space-y-3">
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