import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,Tooltip,Legend);
export function OutlookChart({points}:{points:{date:string;cashOnly:number;withExpected:number}[]}) {
 const fmt=useCurrencyFormat();
 const options:ChartOptions<'line'>={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8}},tooltip:{callbacks:{label:context=>`${context.dataset.label}: ${fmt(context.parsed.y??0)}`}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{ticks:{callback:value=>fmt(Number(value))}}}};
 return <div className="h-56"><Line options={options} data={{labels:points.map(p=>new Date(`${p.date}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short'})),datasets:[{label:'Cash after scheduled commitments',data:points.map(p=>p.cashOnly),borderColor:'#10b981',pointRadius:0,borderWidth:2},{label:'If expected invoices are paid',data:points.map(p=>p.withExpected),borderColor:'#94a3b8',borderDash:[6,4],pointRadius:0,borderWidth:2}]}} /></div>;
}
