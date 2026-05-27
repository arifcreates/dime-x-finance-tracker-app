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
import dimeXWordmarkDark from '../../assets/brand/dimex-wordmark-dark.svg';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

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
      description: 'Record income, client payments, and cash flow without building another spreadsheet.',
    },
    {
      icon: FileText,
      title: 'Send invoices',
      description: 'Create invoices, follow their status, and connect payments to the right account.',
    },
    {
      icon: Receipt,
      title: 'Track expenses',
      description: 'Log spending by category and keep everyday costs easy to review.',
    },
    {
      icon: Wallet,
      title: 'Keep multiple accounts',
      description: 'Separate cash, savings, current, and other balances in one clean view.',
    },
    {
      icon: CreditCard,
      title: 'Plan debt snowball',
      description: 'Prioritize loans and cards with a simple smallest-balance payoff plan.',
    },
    {
      icon: Download,
      title: 'Export reports',
      description: 'Download your data when you need a clear record outside the app.',
    },
  ];

  const differences = [
    'Manual where it matters, so you stay in control of the numbers.',
    'Built for everyday finance tracking, invoices, expenses, accounts, and debt planning.',
    'Clean enough for personal use, structured enough for freelance and small business work.',
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f7f4] text-[#111318]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <nav className="sticky top-0 z-40 border-b border-black/[0.07] bg-[#f7f7f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src={dimeXWordmarkDark} alt="Dime-x" className="h-7 w-auto max-w-[108px] sm:h-9 sm:max-w-none" />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-[#5f6672] transition-colors hover:text-[#111318]">Features</a>
            <a href="#difference" className="text-sm font-medium text-[#5f6672] transition-colors hover:text-[#111318]">Why it works</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuth('login')}
              className="rounded-lg border border-black/[0.11] bg-white px-4 py-2 text-sm font-medium text-[#111318] transition-colors hover:bg-[#efefeb]"
            >
              Login
            </button>
            <button
              onClick={() => openAuth('register')}
              className="rounded-lg bg-[#111318] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-5 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <p className="mb-4 inline-flex rounded-full border border-black/[0.08] bg-white px-3 py-1 text-sm font-medium text-[#5f6672]">
                Simple finance tracking for everyday money
              </p>
              <h1 className="mx-auto max-w-[19rem] text-[2.4rem] font-medium leading-[1.08] tracking-tight text-[#111318] sm:max-w-none sm:text-5xl lg:mx-0 lg:text-6xl">
                Manage your money, invoices, expenses, and debts in one clean place.
              </h1>
              <p className="mx-auto mt-5 max-w-[32rem] text-base leading-7 text-[#5f6672] sm:text-lg lg:mx-0">
                Dime-x gives you a calm way to track inflows, send invoices, organize expenses, manage accounts, export records, and plan loan payoff without extra noise.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button
                  onClick={() => openAuth('register')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111318] px-6 py-3 font-medium text-white transition-colors hover:bg-black"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="inline-flex items-center justify-center rounded-lg border border-black/[0.11] bg-white px-6 py-3 font-medium text-[#111318] transition-colors hover:bg-[#efefeb]"
                >
                  Login
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-white p-3 shadow-[0_24px_70px_rgba(17,19,24,0.10)] sm:p-5">
              <div className="rounded-lg border border-black/[0.08] bg-[#fbfbf8] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6b7280]">Total Balance</p>
                    <p className="text-3xl font-semibold">$12,840</p>
                  </div>
                  <LayoutDashboard className="h-7 w-7 text-[#6b7280]" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Income', '$5,500'],
                    ['Expenses', '$1,240'],
                    ['Flow', '$4,260'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-black/[0.07] bg-white p-3">
                      <p className="text-xs text-[#6b7280]">{label}</p>
                      <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {['Invoice INV-104 marked paid', 'Focus debt: Card balance', 'Export May report'].map(item => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-black/[0.07] bg-white p-3 text-sm text-[#4b5563]">
                      <CheckCircle className="h-4 w-4 text-[#111318]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-black/[0.07] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">What you can do with Dime-x</h2>
              <p className="mx-auto mt-3 max-w-[30rem] text-[#5f6672] lg:mx-0">The useful parts of money management, kept visible and easy to update.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(feature => (
                <div key={feature.title} className="rounded-lg border border-black/[0.08] bg-[#fbfbf8] p-5">
                  <feature.icon className="h-6 w-6 text-[#111318]" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f6672]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="difference" className="border-t border-black/[0.07] px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Different because it stays simple.</h2>
              <p className="mt-4 text-[#5f6672]">
                Dime-x does not try to connect your bank or make automated promises. It gives you a calm place to organize the money decisions you already make.
              </p>
            </div>
            <div className="grid gap-3">
              {differences.map(item => (
                <div key={item} className="flex gap-3 rounded-lg border border-black/[0.08] bg-white p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#111318]" />
                  <p className="text-[#4b5563]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/[0.07] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Start with a clearer view of your money.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#5f6672]">
              Create an account or log in to continue with a dashboard that keeps the important numbers close.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => openAuth('register')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111318] px-6 py-3 font-medium text-white transition-colors hover:bg-black"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => openAuth('login')}
                className="inline-flex items-center justify-center rounded-lg border border-black/[0.11] bg-white px-6 py-3 font-medium text-[#111318] transition-colors hover:bg-[#efefeb]"
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.07] px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center text-sm text-[#6b7280] sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center">
            <img src={dimeXWordmarkDark} alt="Dime-x" className="h-8 w-auto max-w-[130px]" />
          </div>
          <p className="max-w-sm sm:max-w-none">Simple finance tracking, invoices, expenses, accounts, exports, and debt planning.</p>
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
