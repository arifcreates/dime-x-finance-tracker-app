import { errorService } from './services/errorService';
import type { Session } from '@supabase/supabase-js';
import { businessProfileService } from './services/businessProfileService';
import { ErrorToastContainer } from './components/Common/ErrorToast';
import type { AppUser } from './types';
import { useState, useEffect, lazy, Suspense } from 'react';
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
import { Clients } from './pages/Clients';
import { Expenses } from './pages/Expenses';
import { Accounts } from './pages/Accounts';
import { EMI } from './pages/EMI';
import { Recurring } from './pages/Recurring';
const Reports = lazy(() => import('./pages/Reports').then(module=>({default:module.Reports})));
const Billing = lazy(() => import('./pages/Billing'));
const Assistant = lazy(() => import('./pages/Assistant'));
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
  clients: 'Clients',
  expenses: 'Expenses & Receipts',
  accounts: 'Accounts & Cash',
  emi: 'Loans & Credit',
  recurring: 'Subscriptions & Bills',
  reports: 'Reports & Analytics',
  billing: 'Dime-X Plan',
  assistant: 'AI Drafts',
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quickActionRequest, setQuickActionRequest] = useState<{ action: string; id: number } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Initialize theme
  useTheme();

  useEffect(() => {
    const updateVisualViewportOffset = () => {
      const visualViewport = window.visualViewport;
      const bottomOffset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;

      document.documentElement.style.setProperty('--mobile-browser-bottom', `${bottomOffset}px`);
    };

    updateVisualViewportOffset();
    window.visualViewport?.addEventListener('resize', updateVisualViewportOffset);
    window.visualViewport?.addEventListener('scroll', updateVisualViewportOffset);
    window.addEventListener('resize', updateVisualViewportOffset);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateVisualViewportOffset);
      window.visualViewport?.removeEventListener('scroll', updateVisualViewportOffset);
      window.removeEventListener('resize', updateVisualViewportOffset);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let version = 0;
    const restore = async (session: Session | null) => {
      const request = ++version;
      setIsLoading(true);
      try {
        if (session) {
          dataService.setCurrentUserId(session.user.id);
          const profile = await supabaseService.getProfile(session.user.id);
          if (cancelled || request !== version) return;
          businessProfileService.hydrate(profile.business_profile, profile.preferences.currency);
          localStorage.setItem('user', JSON.stringify({id:session.user.id,name:profile.name,email:session.user.email || profile.email,avatar:profile.preferences.avatar || null,preferences:profile.preferences}));
          window.dispatchEvent(new Event('dimex-theme-changed'));
          setUser({ id: session.user.id, name: profile.name, email: session.user.email || profile.email, phone: profile.phone || '', avatar: profile.preferences.avatar || null, preferences: profile.preferences });
          const restoredTransactions = await dataService.getTransactions();
          if (!cancelled && request === version) setTransactions(restoredTransactions);
        } else {
          const savedUser = getSavedUser();
          dataService.setCurrentUserId(null);
          setUser(savedUser?.id === 'guest' ? savedUser : null);
          setTransactions(savedUser?.id === 'guest' ? await dataService.getTransactions() : []);
          if (savedUser?.id !== 'guest') localStorage.removeItem('user');
        }
      } catch (error) {
        if (!cancelled && request === version) { setUser(null); dataService.setCurrentUserId(null); }
        errorService.addError('Could not restore your account. Please sign in again or retry later.');
        console.error('Could not restore your session:', error);
      } finally {
        if (!cancelled && request === version) setIsLoading(false);
      }
    };
    if (!supabaseConfigured) void restore(null);
    else {
      void withTimeout(supabase.auth.getSession(), 10000).then(({data, error}) => { if(error) throw error; return restore(data.session); }).catch(error => { console.error(error); setIsLoading(false); });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Never await database calls inside Supabase's auth callback.
        window.setTimeout(() => { if (!cancelled) void restore(session); }, 0);
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const refreshTransactions = async () => {
    if (user && user.id !== 'guest') {
      dataService.setCurrentUserId(user.id);
      const userTransactions = await dataService.getTransactions();
      setTransactions(userTransactions);
    } else {
      setTransactions(await dataService.getTransactions());
    }
  };

  const handleLogin = async (userData: AppUser) => {
    dataService.setCurrentUserId(userData.id === 'guest' ? null : userData.id);
    if (userData.id !== 'guest') {
      const profile = await supabaseService.getProfile(userData.id);
      businessProfileService.hydrate(profile.business_profile, userData.preferences.currency);
    }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    window.dispatchEvent(new Event('dimex-theme-changed'));
    setTransactions(await dataService.getTransactions());
  };

  const handleLogout = async () => {
    if (user && user.id !== 'guest') await supabaseService.signOut();
    setUser(null);
    setTransactions([]);
    dataService.setCurrentUserId(null);
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('dimex-theme-changed'));
  };

  const handleQuickAction = (action: string) => {
    setSelectedAccountId(null);
    setActiveSection('dashboard');
    setQuickActionRequest({ action, id: Date.now() });
  };

  const handleSearch = (query: string) => {
    setGlobalSearchQuery(query);
    if (query.trim()) {
      setSelectedAccountId(null);
      setActiveSection('reports');
    }
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleCreateAccountFromQuickAction = () => {
    setSelectedAccountId(null);
    setActiveSection('accounts');
  };

  const handleBackToAccounts = () => {
    setSelectedAccountId(null);
  };

  const renderContent = () => {
    const props = { 
      transactions, 
      onQuickAction: handleQuickAction,
      quickActionRequest,
      onQuickActionHandled: () => setQuickActionRequest(null),
      onCreateAccount: handleCreateAccountFromQuickAction,
      user: user || undefined,
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
        return <Income onUpdate={refreshTransactions} onCreateAccount={handleCreateAccountFromQuickAction} />;
      case 'clients':
        return <Clients />;
      case 'expenses':
        return <Expenses />;
      case 'accounts':
        return <Accounts onAccountSelect={handleAccountSelect} onUpdate={refreshTransactions} />;
      case 'emi':
        return <EMI />;
      case 'recurring':
        return <Recurring />;
      case 'billing': return <Billing />;
      case 'assistant': return <Assistant />;
      case 'reports':
        return <Reports searchQuery={globalSearchQuery} />;
      default:
        return <Dashboard {...props} onUpdate={refreshTransactions} />;
    }
  };

  // Show loading state only while restoring a known signed-in user.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f4] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  // Show landing page if no user is logged in
  if (!user) {
    return <><LandingPage onLogin={handleLogin} /><ErrorToastContainer /></>;
  }

  return (
    <><ErrorToastContainer /><CurrencyProvider initialCurrency={user?.preferences?.currency}>
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <div className="flex h-screen bg-[#f7f7f4] dark:bg-gray-900 overflow-hidden">
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
                onClose={() => setIsMobileMenuOpen(false)}
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
            onSearch={handleSearch}
            searchQuery={globalSearchQuery}
          />
          
          <main key={user?.id || 'guest'} className="flex-1 overflow-y-auto pb-[calc(5.75rem+var(--mobile-browser-bottom,0px))] lg:pb-0">
            <Suspense fallback={<p className="p-6">Loading…</p>}>{renderContent()}</Suspense>
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
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
    </CurrencyProvider></>
  );
}

export default App;
