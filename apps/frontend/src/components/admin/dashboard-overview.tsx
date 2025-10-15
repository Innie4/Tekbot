'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { BarChart3, Users, MessageSquare, ArrowUp, ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api/api-client';
import ActivityChart from './charts/ActivityChart';
import AdminDashboard from './AdminDashboard';

interface DashboardStats {
  totalUsers: { value: string; change: string; trend: 'up' | 'down' };
  activeSessions: { value: string; change: string; trend: 'up' | 'down' };
  totalMessages: { value: string; change: string; trend: 'up' | 'down' };
}

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
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchDashboardStats = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.get<DashboardStats>('/analytics/overview');
			setStats(data);
		} catch (err: any) {
			setError(err.message || 'Failed to fetch dashboard stats');
			console.error('Error fetching dashboard stats:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDashboardStats();
	}, []);

	const statsCards = stats ? [
		{
			title: 'Total Users',
			value: stats.totalUsers.value,
			change: stats.totalUsers.change,
			trend: stats.totalUsers.trend,
			icon: Users,
			color: 'from-electric-blue to-blue-400',
		},
		{
			title: 'Active Sessions',
			value: stats.activeSessions.value,
			change: stats.activeSessions.change,
			trend: stats.activeSessions.trend,
			icon: BarChart3,
			color: 'from-green-400 to-emerald-500',
		},
		{
			title: 'Messages',
			value: stats.totalMessages.value,
			change: stats.totalMessages.change,
			trend: stats.totalMessages.trend,
			icon: MessageSquare,
			color: 'from-purple-400 to-indigo-500',
		},
	] : [];

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Dashboard Overview</h2>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading...
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<GlassCard key={i} className="p-6 animate-pulse">
							<div className="h-4 bg-white/10 rounded mb-2"></div>
							<div className="h-8 bg-white/10 rounded mb-2"></div>
							<div className="h-4 bg-white/10 rounded w-1/2"></div>
						</GlassCard>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Dashboard Overview</h2>
				</div>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
				>
					<AlertCircle className="w-5 h-5 text-red-400" />
					<p className="text-red-400">{error}</p>
					<button 
						onClick={fetchDashboardStats}
						className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
					>
						Retry
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Dashboard Overview</h2>
				<p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
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