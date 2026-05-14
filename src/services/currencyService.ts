import { errorService } from './errorService';

class CurrencyService {
  private exchangeRates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.12,
    CAD: 1.35,
    AUD: 1.52,
    JPY: 149.50,
    CHF: 0.88,
    CNY: 7.24,
    SGD: 1.34,
  };

  private lastUpdated: Date = new Date();

  async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // Check if rates are older than 1 hour
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - this.lastUpdated.getTime() > oneHour) {
        await this.updateExchangeRates();
      }
      return this.exchangeRates;
    } catch (error) {
      errorService.addError('Failed to get exchange rates. Using cached rates.', 'warning');
      return this.exchangeRates;
    }
  }

  private async updateExchangeRates(): Promise<void> {
    try {
      // In a real app, you would fetch from a currency API
      // For demo purposes, we'll simulate with slight variations
      const variation = () => 1 + (Math.random() - 0.5) * 0.02; // ±1% variation
      
      this.exchangeRates = {
        USD: 1,
        EUR: 0.85 * variation(),
        GBP: 0.73 * variation(),
        INR: 83.12 * variation(),
        CAD: 1.35 * variation(),
        AUD: 1.52 * variation(),
        JPY: 149.50 * variation(),
        CHF: 0.88 * variation(),
        CNY: 7.24 * variation(),
        SGD: 1.34 * variation(),
      };
      
      this.lastUpdated = new Date();
      localStorage.setItem('exchangeRates', JSON.stringify({
        rates: this.exchangeRates,
        lastUpdated: this.lastUpdated.toISOString(),
      }));
    } catch (error) {
      errorService.addError('Failed to update exchange rates', 'error');
      throw error;
    }
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (!amount || isNaN(amount)) {
        throw new Error('Invalid amount for currency conversion');
      }
      
      if (fromCurrency === toCurrency) return amount;
      
      const rates = await this.getExchangeRates();
      
      if (!rates[fromCurrency] || !rates[toCurrency]) {
        throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
      }
      
      const usdAmount = amount / rates[fromCurrency];
      return usdAmount * rates[toCurrency];
    } catch (error) {
      errorService.addError(`Currency conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return amount; // Return original amount as fallback
    }
  }

  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    ];
  }

  getCurrencySymbol(currencyCode: string): string {
    try {
      const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
      return currency?.symbol || '$';
    } catch (error) {
      errorService.addError('Failed to get currency symbol', 'warning');
      return '$';
    }
  }

  constructor() {
    try {
      // Load cached rates on initialization
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const { rates, lastUpdated } = JSON.parse(cached);
        this.exchangeRates = rates;
        this.lastUpdated = new Date(lastUpdated);
      }
    } catch (error) {
      errorService.addError('Failed to load cached exchange rates', 'warning');
    }
  }
}

export const currencyService = new CurrencyService();