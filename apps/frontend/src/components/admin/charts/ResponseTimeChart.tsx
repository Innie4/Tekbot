'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const sampleData = [
  { name: 'Mon', time: 2.1 },
  { name: 'Tue', time: 1.8 },
  { name: 'Wed', time: 2.5 },
  { name: 'Thu', time: 2.0 },
  { name: 'Fri', time: 1.6 },
  { name: 'Sat', time: 2.3 },
  { name: 'Sun', time: 2.7 },
];

export default function ResponseTimeChart({
  data = sampleData,
}: {
  data?: { name: string; time: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="time" stroke="#ffc658" fill="#ffc658" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
