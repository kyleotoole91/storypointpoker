import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Member } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  members: Member[];
  revealed: boolean;
}

export const PieChart = ({ members, revealed }: PieChartProps) => {
  if (!revealed) return null;

  const votes = members.filter(m => m.vote && m.vote !== '?').map(m => m.vote);
  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote as string] = (acc[vote as string] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = {
    labels: Object.keys(voteCounts),
    datasets: [
      {
        data: Object.values(voteCounts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return <Pie data={data} options={options} />;
};