import React, { useState } from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Shield, Smartphone, BarChart3, DollarSign, Target, PieChart, Globe, Lock, Monitor, Play, Star, Users, Zap } from 'lucide-react';
import { AuthModal } from '../Auth/AuthModal';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

// Custom star logo component using the provided SVG - bigger size
const DimeXLogo: React.FC<{ className?: string }> = ({ className = "h-12 w-12" }) => (
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

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Tracking',
      subtitle: 'Know Where Every Dollar Goes',
      description: 'Automatically categorize expenses and see spending patterns that help you make better financial decisions.'
    },
    {
      icon: PieChart,
      title: 'Visual Insights',
      subtitle: 'Understand Your Money Flow',
      description: 'Beautiful charts and graphs that turn complex financial data into clear, actionable insights.'
    },
    {
      icon: Monitor,
      title: 'Unified Dashboard',
      subtitle: 'Everything in One Place',
      description: 'Connect all your accounts, track investments, and manage budgets from a single, intuitive interface.'
    }
  ];

  const dashboardFeatures = [
    'Real-time account balances across all banks',
    'Smart spending alerts before you overspend',
    'Automated savings goals with progress tracking',
    'Investment portfolio performance monitoring',
    'Bill reminders that actually prevent late fees'
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Your Accounts',
      subtitle: 'Secure Bank-Level Encryption',
      description: 'Link your bank accounts, credit cards, and investments with military-grade security in under 2 minutes.'
    },
    {
      number: '02',
      title: 'Set Smart Goals',
      subtitle: 'AI-Powered Recommendations',
      description: 'Our intelligent system analyzes your spending and suggests personalized budgets and savings targets.'
    },
    {
      number: '03',
      title: 'Watch Your Wealth Grow',
      subtitle: 'Automated Financial Success',
      description: 'Get real-time insights, automated savings, and smart alerts that keep you on track to financial freedom.'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Minimal Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-white/5 to-gray-300/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-gray-300/3 to-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-gradient-to-r from-white/4 to-gray-200/4 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <DimeXLogo className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-black" />
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Dime-x
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors font-medium text-base lg:text-lg">Features</a>
            <a href="#about" className="text-gray-400 hover:text-white transition-colors font-medium text-base lg:text-lg">How It Works</a>
          </div>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="group relative px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 rounded-lg sm:rounded-xl hover:border-white/30 hover:text-white transition-all font-medium text-sm sm:text-base lg:text-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-gray-300/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative">Get Started</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 xl:py-32">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Heading with Better Mobile Responsiveness */}
          <div className="space-y-8 sm:space-y-12 lg:space-y-16 mb-12 sm:mb-16 lg:mb-20">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black leading-[0.9] sm:leading-[0.85] tracking-tighter text-white drop-shadow-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                Stop Wondering Where Your Money Went
              </h1>
            </div>
            
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
              <p className="text-gray-400 leading-relaxed font-normal tracking-wide text-base sm:text-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                Finally, a finance app that actually helps you save money instead of just tracking where it disappeared.
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-300 font-light max-w-4xl mx-auto leading-relaxed">
                Dime-x uses AI to predict your spending, prevent overspending, and automatically optimize your finances so you can build real wealth.
              </p>
            </div>
          </div>

          {/* CTA Section with Better Mobile Layout */}
          <div className="flex flex-col items-center space-y-8 sm:space-y-10 lg:space-y-12">
            <button
              onClick={() => setShowAuthModal(true)}
              className="group relative px-8 py-4 sm:px-10 sm:py-4 lg:px-12 lg:py-5 bg-white text-black rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl hover:bg-gray-100 transition-all duration-300 overflow-hidden shadow-2xl"
            >
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center space-x-2 sm:space-x-3">
                <span>Start Building Wealth</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            {/* Trust Indicators with Better Mobile Layout */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 text-gray-500">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
                <span className="text-sm font-medium">AI-Powered Insights</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-700"></div>
                <span className="text-sm font-medium">Automated Savings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Floating Elements */}
        <div className="absolute top-32 left-12 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse hidden lg:block"></div>
        <div className="absolute top-48 right-16 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse delay-300 hidden lg:block"></div>
        <div className="absolute bottom-32 left-20 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse delay-700 hidden lg:block"></div>
        <div className="absolute top-64 left-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse delay-1000 hidden lg:block"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 text-white">
              Why Dime-x Actually Works
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
              Unlike other finance apps that just show you charts, Dime-x actively helps you make better financial decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl hover:border-gray-700/50 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-gray-300/3 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white border border-gray-600/50 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 lg:mb-8 group-hover:border-white/30 transition-all duration-300">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-black" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-300 mb-4 sm:mb-6">{feature.subtitle}</h4>
                  <p className="text-gray-400 leading-relaxed text-base sm:text-lg">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="about" className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 text-white">
              Your Financial Command Center
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 mb-4 sm:mb-6">
              See Everything That Matters
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16 leading-relaxed">
              One dashboard that shows your complete financial picture and tells you exactly what to do next to improve it.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">What You'll See at a Glance:</h3>
              {dashboardFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 sm:space-x-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white border border-gray-600/50 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full"></div>
                  </div>
                  <span className="text-gray-300 text-base sm:text-lg lg:text-xl font-medium leading-relaxed">{feature}</span>
                </div>
              ))}
              
              <div className="pt-4 sm:pt-6 lg:pt-8">
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 lg:mb-6">Personalized for You</h4>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                  Dime-x learns your spending patterns and financial goals to provide insights that actually matter to your situation.
                </p>
              </div>
            </div>

            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-gray-300/5 rounded-xl sm:rounded-2xl blur-xl"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl border border-gray-800/50 shadow-2xl">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 rounded-lg sm:rounded-xl">
                    <span className="text-gray-300 font-semibold text-base sm:text-lg">Net Worth</span>
                    <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">$47,850</span>
                  </div>
                  <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 rounded-lg sm:rounded-xl">
                    <span className="text-gray-300 font-semibold text-base sm:text-lg">Monthly Savings Rate</span>
                    <span className="text-green-400 font-bold text-lg sm:text-xl">23%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 rounded-lg sm:rounded-xl">
                    <span className="text-gray-300 font-semibold text-base sm:text-lg">Investment Growth</span>
                    <span className="text-green-400 font-bold text-lg sm:text-xl">+12.4%</span>
                  </div>
                  <div className="p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 rounded-lg sm:rounded-xl">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <span className="text-gray-300 font-semibold text-base sm:text-lg">Emergency Fund Goal</span>
                      <span className="text-gray-500 text-sm font-medium">87%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                      <div className="bg-gradient-to-r from-white to-gray-300 h-2 sm:h-3 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 text-white">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed">
              From setup to financial success in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white border border-gray-600/50 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto group-hover:border-white/30 transition-all duration-300">
                    <span className="text-xl sm:text-2xl font-bold text-black">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 sm:top-9 lg:top-10 left-full w-full h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{step.title}</h3>
                <h4 className="text-base sm:text-lg font-semibold text-gray-300 mb-4 sm:mb-6">{step.subtitle}</h4>
                <p className="text-gray-400 leading-relaxed text-base sm:text-lg">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            
            {/* Minimal Floating Elements */}
            <div className="absolute top-8 right-8 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse hidden sm:block"></div>
            <div className="absolute bottom-12 left-12 w-2 h-2 bg-white rounded-full opacity-50 animate-pulse delay-1000 hidden sm:block"></div>
            
            <div className="relative text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                Ready to Stop Living Paycheck to Paycheck?
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands who've already taken control of their finances and started building real wealth with Dime-x.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="group relative px-8 py-4 sm:px-10 sm:py-4 lg:px-12 lg:py-5 bg-white text-black rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl hover:bg-gray-100 transition-all duration-300 overflow-hidden shadow-2xl"
              >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center space-x-2 sm:space-x-4">
                  <span className="text-center">Start Your Financial Transformation</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-16">
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <DimeXLogo className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-black" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  Dime-x
                </span>
              </div>
              <p className="text-gray-400 mb-4 sm:mb-6 max-w-md text-base sm:text-lg leading-relaxed">
                The only finance app that actually helps you build wealth, not just track spending.
              </p>
              <p className="text-gray-600 text-sm">
                Empowering individuals to achieve true financial freedom.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">Support</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">Getting Started</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">Help Center</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 sm:mb-6 text-base sm:text-lg">Company</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">About Us</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white transition-colors text-base sm:text-lg">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-6 sm:pt-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                &copy; 2024 Dime-x. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={onLogin}
      />
    </div>
  );
};