import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { errorService } from '../../services/errorService';

interface ErrorToastProps {
  error: {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: Date;
  };
  onClose: (id: string) => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${getBackgroundColor()} shadow-lg animate-in slide-in-from-right-2 duration-300`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-sm font-medium text-gray-900">{error.message}</p>
      </div>
      <button
        onClick={() => onClose(error.id)}
        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
};

export const ErrorToastContainer: React.FC = () => {
  const [errors, setErrors] = useState<Array<{ id: string; message: string; type: 'error' | 'warning' | 'info'; timestamp: Date }>>([]);

  useEffect(() => {
    const unsubscribe = errorService.subscribe(setErrors);
    return unsubscribe;
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {errors.map((error) => (
        <ErrorToast
          key={error.id}
          error={error}
          onClose={errorService.removeError.bind(errorService)}
        />
      ))}
    </div>
  );
};