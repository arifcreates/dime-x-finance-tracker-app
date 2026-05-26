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
    } catch {}
    return 'USD';
  });

  useEffect(() => {
    if (initialCurrency && initialCurrency !== currency) {
      setCurrencyState(initialCurrency);
    }
  }, [initialCurrency]);

  const setCurrency = (c: string) => setCurrencyState(c);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
