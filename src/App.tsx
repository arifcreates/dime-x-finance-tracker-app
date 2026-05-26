import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { LandingPage } from './components/Landing/LandingPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { MobileNav } from './components/Layout/MobileNav';
import { SettingsModal } from './components/Settings/SettingsModal';
import { QuickActionsFAB } from './components/Dashboard/QuickActionsFAB';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Accounts } from './pages/Accounts';
import { EMI } from './pages/EMI';
import { Recurring } from './pages/Recurring';
import { Reports } from './pages/Reports';
import { AccountDetail } from './pages/AccountDetail';
import { dataService } from './services/dataService';
import { supabaseService } from './services/supabaseService';
import { supabase, supabaseConfigured } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Transaction } from './types';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  income: 'Income & Invoices',
  expenses: 'Expenses & Receipts',
  accounts: 'Accounts & Cash',
  emi: 'Loans & Credit',
  recurring: 'Recurring Payments',
  reports: 'Reports & Analytics',
};

// Detect touch device
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    const userData = JSON.parse(savedUser);
    return userData?.id ? userData : null;
  } catch (error) {
    console.warn('Ignoring invalid saved user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Session check timed out')), timeoutMs);
    }),
  ]);
};

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickActionRequest, setQuickActionRequest] = useState<{ action: string; id: number } | null>(null);

  // Initialize theme
  useTheme();

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      setIsLoading(true);
      try {
        if (!supabaseConfigured) {
          const savedUser = getSavedUser();
          if (savedUser) {
            setUser(savedUser);
            setTransactions([]);
          }
          return;
        }

        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 2500);
        
        if (session?.user) {
          // Get user profile
          const profile = await supabaseService.getProfile(session.user.id);
          
          const userData = {
            id: session.user.id,
            name: profile.name,
            email: profile.email,
            avatar: null,
            preferences: profile.preferences || {
              theme: 'dark',
              currency: 'USD',
              notifications: true,
            }
          };
          
          setUser(userData);
          // Load transactions
          const userTransactions = await dataService.getTransactions();
          setTransactions(userTransactions);
        } else {
          // Check for guest user in localStorage
          const savedUser = getSavedUser();
          if (savedUser) {
            setUser(savedUser);
            setTransactions([]);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (skip if Supabase not configured)
    let unsubscribe = () => {};
    if (supabaseConfigured) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setTransactions([]);
            localStorage.removeItem('user');
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth state change setup error:', error);
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshTransactions = async () => {
    if (user && user.id !== 'guest') {
      const userTransactions = await dataService.getTransactions();
      setTransactions(userTransactions);
    } else {
      setTransactions([]);
    }
  };

  const handleLogin = async (userData: any) => {
    setUser(userData);
    
    if (userData.id === 'guest') {
      localStorage.setItem('user', JSON.stringify(userData));
      setTransactions([]);
    } else {
      localStorage.setItem('user', JSON.stringify(userData));
      // Load user's transactions from Supabase
      await refreshTransactions();
    }
  };

  const handleLogout = async () => {
    try {
      if (user && user.id !== 'guest') {
        await supabaseService.signOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    setUser(null);
    setTransactions([]);
    localStorage.removeItem('user');
  };

  const handleQuickAction = (action: string) => {
    setSelectedAccountId(null);
    setActiveSection('dashboard');
    setQuickActionRequest({ action, id: Date.now() });
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleBackToAccounts = () => {
    setSelectedAccountId(null);
  };

  const renderContent = () => {
    const props = { 
      transactions, 
      onQuickAction: handleQuickAction,
      quickActionRequest,
      user,
      onUpdate: refreshTransactions
    };

    // Show account detail if an account is selected
    if (selectedAccountId && activeSection === 'accounts') {
      return (
        <AccountDetail 
          accountId={selectedAccountId} 
          onBack={handleBackToAccounts}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard {...props} onUpdate={refreshTransactions} />;
      case 'income':
        return <Income onUpdate={refreshTransactions} />;
      case 'expenses':
        return <Expenses onUpdate={refreshTransactions} />;
      case 'accounts':
        return <Accounts onAccountSelect={handleAccountSelect} onUpdate={refreshTransactions} />;
      case 'emi':
        return <EMI onUpdate={refreshTransactions} />;
      case 'recurring':
        return <Recurring onUpdate={refreshTransactions} />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard {...props} onUpdate={refreshTransactions} />;
    }
  };

  // Show loading state only while restoring a known signed-in user.
  if (isLoading && user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  // Show landing page if no user is logged in
  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <CurrencyProvider initialCurrency={user?.preferences?.currency}>
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection}
            user={user}
            onSettingsClick={() => setShowSettingsModal(true)}
          />
        </div>
        
        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 shadow-xl">
              <Sidebar 
                activeSection={activeSection} 
                onSectionChange={(section) => {
                  setActiveSection(section);
                  setIsMobileMenuOpen(false);
                }}
                user={user}
                onSettingsClick={() => {
                  setShowSettingsModal(true);
                  setIsMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            sectionTitle={sectionTitles[activeSection]} 
            onMenuClick={() => setIsMobileMenuOpen(true)}
            user={user}
            onSettingsClick={() => setShowSettingsModal(true)}
          />
          
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden">
            <MobileNav 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>
        </div>

        {/* Quick Actions FAB - Mobile Only */}
        <div className="lg:hidden">
          <QuickActionsFAB onAction={handleQuickAction} />
        </div>

        {/* Modals */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
          onUpdateUser={setUser}
          onLogout={handleLogout}
        />
      </div>
    </DndProvider>
    </CurrencyProvider>
  );
}

export default App;
