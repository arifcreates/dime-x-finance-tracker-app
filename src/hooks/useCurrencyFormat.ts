import { useCurrency } from '../contexts/CurrencyContext';
import { formatCurrency } from '../utils/formatters';

export const useCurrencyFormat = () => {
  const { currency } = useCurrency();
  return (amount: number, sourceCurrency = currency) => formatCurrency(amount, sourceCurrency);
};
