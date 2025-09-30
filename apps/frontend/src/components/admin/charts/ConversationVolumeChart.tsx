import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const sampleData = [
  { name: 'Mon', volume: 30 },
  { name: 'Tue', volume: 45 },
  { name: 'Wed', volume: 50 },
  { name: 'Thu', volume: 40 },
  { name: 'Fri', volume: 60 },
  { name: 'Sat', volume: 35 },
  { name: 'Sun', volume: 20 },
];

export default function ConversationVolumeChart({ data = sampleData }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="volume" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
