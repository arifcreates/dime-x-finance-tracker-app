import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
ChartJS.register(ArcElement,Tooltip,Legend);
const colors=['#202a37','#10b981','#60a5fa','#f59e0b','#a78bfa','#cbd5e1'];
export function SpendingDonut({slices,spent,earned,onSelect}:{slices:{name:string;amount:number;categories:string[]}[];spent:number;earned:number;onSelect:(categories:string[])=>void}) {
  const fmt=useCurrencyFormat();
  const options:ChartOptions<'doughnut'>={responsive:true,maintainAspectRatio:false,cutout:'76%',plugins:{legend:{display:false},tooltip:{callbacks:{label:context=>`${context.label}: ${fmt(context.parsed)}`}}},onClick:(_event,elements)=>{if(elements[0])onSelect(slices[elements[0].index].categories);}};
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
    <h2 className="font-semibold text-gray-900 dark:text-white">Where it went <span className="ml-2 text-xs font-normal text-gray-500">{new Date().toLocaleDateString('en-IN',{month:'long'})}</span></h2>
    {spent>0?<div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0"><Doughnut data={{labels:slices.map(s=>s.name),datasets:[{data:slices.map(s=>s.amount),backgroundColor:colors,borderWidth:0,hoverOffset:4}]}} options={options} /><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold text-gray-900 dark:text-white">{fmt(spent)}</span><span className="text-xs text-gray-500">spent this month</span></div></div>
      <div className="w-full space-y-2">{slices.map((slice,index)=><button key={slice.name} onClick={()=>onSelect(slice.categories)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:colors[index]}} /><span className="flex-1 text-gray-700 dark:text-gray-300">{slice.name}</span><span className="font-medium text-gray-900 dark:text-white">{Math.round(slice.amount/spent*100)}%</span></button>)}</div>
    </div>:<p className="py-12 text-center text-sm text-gray-500">No expenses recorded this month. Your next expense will appear here.</p>}
    <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800">In <span className="font-semibold text-emerald-600">{fmt(earned)}</span> <span className="mx-2">·</span> Out <span className="font-semibold text-gray-900 dark:text-white">{fmt(spent)}</span></p>
  </section>;
}
