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
          '#ff6600', // Ocuco orange
          '#4CAF50', // Green
          '#2196F3', // Blue
          '#9C27B0', // Purple
          '#FFC107', // Amber
          '#E91E63', // Pink
          '#00BCD4', // Cyan
          '#795548', // Brown
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