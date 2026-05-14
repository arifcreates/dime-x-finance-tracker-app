class ErrorService {
  private static instance: ErrorService;
  private errorQueue: Array<{ id: string; message: string; type: 'error' | 'warning' | 'info'; timestamp: Date }> = [];
  private listeners: Array<(errors: typeof this.errorQueue) => void> = [];

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  addError(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    const error = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    
    this.errorQueue.push(error);
    this.notifyListeners();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeError(error.id);
    }, 5000);
  }

  removeError(id: string): void {
    this.errorQueue = this.errorQueue.filter(error => error.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (errors: typeof this.errorQueue) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.errorQueue]));
  }

  clearAll(): void {
    this.errorQueue = [];
    this.notifyListeners();
  }
}

export const errorService = ErrorService.getInstance();