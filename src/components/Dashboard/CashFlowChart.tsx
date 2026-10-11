import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { currencyService } from '../../services/currencyService';
import { formatCurrency } from '../../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Transaction } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashFlowChartProps {
  transactions: Transaction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions }) => {
  const { currency } = useCurrency();
  const [normalized, setNormalized] = useState<Transaction[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all(transactions.filter(t=>t.status==='completed' && t.category!=='Transfer').map(async t=>({ ...t, amount: await currencyService.convertCurrency(t.amount,t.currency || 'USD',currency) }))).then(items=>{if(active)setNormalized(items);}).catch(()=>{if(active)setNormalized([]);});
    return () => {active=false;};
  }, [transactions,currency]);
  const months = [];
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push({
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }

  const chartData = months.map(month => {
    const monthTransactions = normalized.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month.month && 
             transactionDate.getFullYear() === month.year;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, cashFlow: income - expenses };
  });

  const data = {
    labels: months.map(m => m.label),
    datasets: [
      {
        label: 'Net Cash Flow',
        data: chartData.map(d => d.cashFlow),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: {
          size: 12,
          weight: 600,
        },
        bodyFont: {
          size: 12,
          weight: 500,
        },
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const value = context.parsed.y;
            const sign = value >= 0 ? '+' : '';
            return `Cash Flow: ${sign}$${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          },
        ticks: {
          callback: function(value: string | number) {
            return formatCurrency(Number(value),currency);
          },
          font: {
            size: 11,
            weight: 500,
          },
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: 600,
          },
          color: '#374151',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="h-full">
      <Line data={data} options={options} />
    </div>
  );
};