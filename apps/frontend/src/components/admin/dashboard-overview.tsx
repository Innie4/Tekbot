'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { BarChart3, Users, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import ActivityChart from './charts/ActivityChart';
import AdminDashboard from './AdminDashboard';

const statsCards = [
	{
		title: 'Total Users',
		value: '2,543',
		change: '+12.5%',
		trend: 'up',
		icon: Users,
		color: 'from-electric-blue to-blue-400',
	},
	{
		title: 'Active Sessions',
		value: '1,873',
		change: '+18.2%',
		trend: 'up',
		icon: BarChart3,
		color: 'from-green-400 to-emerald-500',
	},
	{
		title: 'Messages',
		value: '10,483',
		change: '-3.4%',
		trend: 'down',
		icon: MessageSquare,
		color: 'from-purple-400 to-indigo-500',
	},
];

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardOverview() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Dashboard Overview</h2>
				<p className="text-sm text-muted-foreground">Last updated: Today at 09:41 AM</p>
			</div>

			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
			>
				{statsCards.map((card) => (
					<motion.div key={card.title} variants={item}>
						<GlassCard className="p-6">
							<div className="flex justify-between items-start">
								<div>
									<p className="text-sm text-muted-foreground">{card.title}</p>
									<h3 className="text-3xl font-bold mt-1">{card.value}</h3>
									<div className="flex items-center mt-2">
										<span
											className={`flex items-center text-sm ${card.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}
										>
											{card.trend === 'up' ? (
												<ArrowUp className="h-3 w-3 mr-1" />
											) : (
												<ArrowDown className="h-3 w-3 mr-1" />
											)}
											{card.change}
										</span>
										<span className="text-xs text-muted-foreground ml-2">vs last month</span>
									</div>
								</div>
								<div className={`p-3 rounded-full bg-gradient-to-r ${card.color} bg-opacity-10`}>
									<card.icon className="h-6 w-6 text-white" />
								</div>
							</div>
						</GlassCard>
					</motion.div>
				))}
			</motion.div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<GlassCard className="lg:col-span-2 p-6">
					<h3 className="text-lg font-medium mb-4">User Activity</h3>
					<div className="h-64 border border-border/10 rounded-md bg-background">
						<ActivityChart />
					</div>
				</GlassCard>

				<GlassCard className="p-6">
					<h3 className="text-lg font-medium mb-4">Recent Messages</h3>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-start gap-3 pb-3 border-b border-border/10">
								<div className="w-8 h-8 rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan flex items-center justify-center text-xs font-medium">
									U{i}
								</div>
								<div>
									<p className="text-sm font-medium">User #{i}</p>
									<p className="text-xs text-muted-foreground mt-1">
										Lorem ipsum dolor sit amet, consectetur adipiscing elit.
									</p>
									<p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
								</div>
							</div>
						))}
					</div>
				</GlassCard>
			</div>

			<AdminDashboard />
		</div>
	);
}