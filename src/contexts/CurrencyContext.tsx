import { businessProfileService } from '../services/businessProfileService';
import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext<{
  currency: string;
  setCurrency: (c: string) => void;
}>({ currency: 'USD', setCurrency: () => {} });

export const CurrencyProvider: React.FC<{ children: React.ReactNode; initialCurrency?: string }> = ({
  children,
  initialCurrency,
}) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (initialCurrency) return initialCurrency;
    try {
      const user = localStorage.getItem('user');
      if (user) return JSON.parse(user).preferences?.currency || 'USD';
    } catch { /* Use the default for invalid browser preferences. */ }
    return 'USD';
  });

  useEffect(() => {
    if (initialCurrency) {
      businessProfileService.setReportCurrency(initialCurrency);
      setCurrencyState(initialCurrency);
    }
  }, [initialCurrency]);

  const setCurrency = (c: string) => { businessProfileService.setReportCurrency(c); setCurrencyState(c); };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => useContext(CurrencyContext);
