import { errorService } from './errorService';

class CurrencyService {
  private exchangeRates: Record<string, number> = { USD: 1 };
  private refreshing: Promise<void> | null = null;
  private lastUpdated: Date = new Date(0);

  async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // Check if rates are older than 1 hour
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - this.lastUpdated.getTime() > oneHour) {
        if (!this.refreshing) this.refreshing = this.updateExchangeRates().finally(() => { this.refreshing = null; });
        await this.refreshing;
      }
      return this.exchangeRates;
    } catch {
      errorService.addError('Failed to get exchange rates. Using cached rates.', 'warning');
      if (Date.now() - this.lastUpdated.getTime() > 24 * 60 * 60 * 1000) throw new Error('Current exchange rates unavailable.');
      return this.exchangeRates;
    }
  }

  private async updateExchangeRates(): Promise<void> {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error('Exchange rate service unavailable');
      }

      const data = await response.json();
      if (data.result !== 'success' || !data.rates) {
        throw new Error('Exchange rate response was invalid');
      }

      const supportedCurrencies = this.getSupportedCurrencies().map((currency) => currency.code);
      this.exchangeRates = supportedCurrencies.reduce<Record<string, number>>((rates, currency) => {
        rates[currency] = Number(data.rates[currency]) || this.exchangeRates[currency];
        return rates;
      }, {});
      
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
      if (!Number.isFinite(amount)) {
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
      throw new Error('Currency conversion unavailable. Please retry before recording payment.');
    }
  }

  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    ];
  }

  getCurrencySymbol(currencyCode: string): string {
    try {
      const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
      return currency?.symbol || '$';
    } catch {
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
    } catch {
      errorService.addError('Failed to load cached exchange rates', 'warning');
    }
  }
}

export const currencyService = new CurrencyService();
