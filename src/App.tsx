import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { LandingPage } from './components/Landing/LandingPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { MobileNav } from './components/Layout/MobileNav';
import { AuthModal } from './components/Auth/AuthModal';
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
import { useTheme } from './hooks/useTheme';
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

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme
  useTheme();

  useEffect(() => {
    // Check for existing user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      // Initialize sample data for registered users
      dataService.initializeSampleData();
      // Load transactions
      setTransactions(dataService.getTransactions());
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
    
    // Initialize sample data for new users (not guests)
    if (userData.id !== 'guest') {
      dataService.initializeSampleData();
    }
    
    // Load transactions
    setTransactions(dataService.getTransactions());
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowAuthModal(false);
    setTransactions([]);
  };

  const handleQuickAction = (action: string) => {
    // This will be handled by individual pages
    console.log('Quick action:', action);
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
      user 
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
        return <Dashboard {...props} />;
      case 'income':
        return <Income />;
      case 'expenses':
        return <Expenses />;
      case 'accounts':
        return <Accounts onAccountSelect={handleAccountSelect} />;
      case 'emi':
        return <EMI />;
      case 'recurring':
        return <Recurring />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard {...props} />;
    }
  };

  // Show loading state
  if (isLoading) {
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
  );
}

export default App;