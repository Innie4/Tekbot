'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const sampleData = [
  { name: 'Jan', users: 120 },
  { name: 'Feb', users: 98 },
  { name: 'Mar', users: 150 },
  { name: 'Apr', users: 200 },
  { name: 'May', users: 170 },
];

export default function ActivityChart({
  data = sampleData,
}: {
  data?: { name: string; users: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="users" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
