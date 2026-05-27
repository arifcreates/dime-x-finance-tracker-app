import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Receipt,
  Wallet,
} from 'lucide-react';
import { AuthModal } from '../Auth/AuthModal';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

const DimeXLogo: React.FC<{ className?: string }> = ({ className = 'h-12 w-12' }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <g>
      <polygon points="85.1,50 72.3,72.3 59.4,50 72.3,27.7" />
      <polygon points="14.9,50 27.7,72.3 40.6,50 27.7,27.7" />
      <polygon points="50,40.6 72.3,27.7 50,14.9 27.7,27.7" />
      <polygon points="50,85.1 72.3,72.3 50,59.4 27.7,72.3" />
    </g>
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Track inflows',
      description: 'Record income, client payments, and cash flow without a complicated spreadsheet.',
    },
    {
      icon: FileText,
      title: 'Send invoices',
      description: 'Create invoices, track statuses, and mark payments against the account they belong to.',
    },
    {
      icon: Receipt,
      title: 'Track expenses',
      description: 'Capture spending by category and keep your business costs visible.',
    },
    {
      icon: Wallet,
      title: 'Keep multiple accounts',
      description: 'Separate cash, savings, current, and investment balances in one simple dashboard.',
    },
    {
      icon: CreditCard,
      title: 'Plan debt snowball',
      description: 'See which loan or card balance to focus on first using a smallest-balance plan.',
    },
    {
      icon: Download,
      title: 'Export reports',
      description: 'Download your finance data when you need a clean record outside the app.',
    },
  ];

  const differences = [
    'Manual and intentional, so you stay in control of the numbers.',
    'Built for everyday finance tracking, invoices, expenses, accounts, and debt planning.',
    'Clean enough for personal use, structured enough for freelance and small business work.',
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <DimeXLogo className="h-7 w-7 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dime-x</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">Features</a>
            <a href="#difference" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">Why it works</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuth('login')}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Login
            </button>
            <button
              onClick={() => openAuth('register')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full border border-white/15 px-3 py-1 text-sm font-medium text-gray-300">
                Simple finance tracking for real life
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Manage your money, invoices, expenses, and debts in one clean place.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
                Dime-x helps you track inflows, send invoices, organize expenses, manage multiple accounts, export reports, and plan loan payoff without noisy features you do not need.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => openAuth('register')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-200"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Login
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-5">
              <div className="rounded-xl border border-white/10 bg-black p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Balance</p>
                    <p className="text-3xl font-bold">$12,840</p>
                  </div>
                  <LayoutDashboard className="h-7 w-7 text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Income', '$5,500'],
                    ['Expenses', '$1,240'],
                    ['Flow', '$4,260'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="mt-1 text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {['Invoice INV-104 marked paid', 'Focus debt: Card balance', 'Export May report'].map(item => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-white" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-white/10 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What you can do with Dime-x</h2>
              <p className="mt-3 text-gray-400">The core tools are practical, visible, and easy to use.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(feature => (
                <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <feature.icon className="h-6 w-6 text-white" />
                  <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="difference" className="border-t border-white/10 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Different because it stays simple.</h2>
              <p className="mt-4 text-gray-400">
                Dime-x is not trying to connect your bank or make automated promises. It gives you a calm place to organize the money decisions you already make.
              </p>
            </div>
            <div className="grid gap-3">
              {differences.map(item => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start with a clearer view of your money.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Create an account or log in to continue managing your finances with the same clean dashboard.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => openAuth('register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-200"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => openAuth('login')}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <DimeXLogo className="h-5 w-5 text-black" />
            </div>
            <span>Dime-x</span>
          </div>
          <p>Simple finance tracking, invoices, expenses, accounts, exports, and debt planning.</p>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={onLogin}
        initialMode={authMode}
      />
    </div>
  );
};
