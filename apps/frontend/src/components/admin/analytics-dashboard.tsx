'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/api-client';
import ConversationVolumeChart from './charts/ConversationVolumeChart';
import ResponseTimeChart from './charts/ResponseTimeChart';

interface AnalyticsData {
  totalConversations: { value: string; change: string; trend: string };
  avgResponseTime: { value: string; change: string; trend: string };
  userSatisfaction: { value: string; change: string; trend: string };
  failedResponses: { value: string; change: string; trend: string };
  conversationVolume: Array<{ date: string; conversations: number }>;
  responseTimeData: Array<{ hour: number; responseTime: number }>;
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

export default function AnalyticsDashboard() {
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadAnalyticsData();
	}, []);

	const loadAnalyticsData = async () => {
		try {
			const response = await api.get<{ success: boolean; message: string; data: AnalyticsData }>('/analytics/dashboard');
			setAnalyticsData(response.data);
		} catch (error) {
			console.error('Failed to load analytics data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const analyticsCards = analyticsData ? [
		{
			title: 'Total Conversations',
			value: analyticsData.totalConversations.value,
			change: analyticsData.totalConversations.change,
			trend: analyticsData.totalConversations.trend,
		},
		{
			title: 'Avg. Response Time',
			value: analyticsData.avgResponseTime.value,
			change: analyticsData.avgResponseTime.change,
			trend: analyticsData.avgResponseTime.trend,
		},
		{
			title: 'User Satisfaction',
			value: analyticsData.userSatisfaction.value,
			change: analyticsData.userSatisfaction.change,
			trend: analyticsData.userSatisfaction.trend,
		},
		{
			title: 'Failed Responses',
			value: analyticsData.failedResponses.value,
			change: analyticsData.failedResponses.change,
			trend: analyticsData.failedResponses.trend,
		},
	] : [];

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<h2 className="text-2xl font-bold">Analytics Dashboard</h2>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<GlassCard key={i} className="p-6 animate-pulse">
							<div className="h-4 bg-gray-300 rounded mb-2"></div>
							<div className="h-8 bg-gray-300 rounded mb-2"></div>
							<div className="h-4 bg-gray-300 rounded w-1/2"></div>
						</GlassCard>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<h2 className="text-2xl font-bold">Analytics Dashboard</h2>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						Last 30 days
					</Button>
					<Button variant="outline" size="sm">
						Export
					</Button>
				</div>
			</div>

			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
			>
				{analyticsCards.map((card) => (
					<motion.div key={card.title} variants={item}>
						<GlassCard className="p-6">
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
								<span className="text-xs text-muted-foreground ml-2">vs last period</span>
							</div>
						</GlassCard>
					</motion.div>
				))}
			</motion.div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<GlassCard className="p-6">
					<h3 className="text-lg font-medium mb-4">Conversation Volume</h3>
					<div className="h-64 border border-border/10 rounded-md bg-background">
						<ConversationVolumeChart />
					</div>
				</GlassCard>

				<GlassCard className="p-6">
					<h3 className="text-lg font-medium mb-4">Response Time</h3>
					<div className="h-64 border border-border/10 rounded-md bg-background">
						<ResponseTimeChart />
					</div>
				</GlassCard>
			</div>

			<GlassCard className="p-6">
				<h3 className="text-lg font-medium mb-4">Top User Queries</h3>
				<div className="space-y-4">
					{[
						{ query: 'How to reset my password?', count: 342 },
						{ query: 'Subscription pricing options', count: 287 },
						{ query: 'Integration with third-party services', count: 231 },
						{ query: 'API documentation location', count: 198 },
						{ query: 'Account deletion process', count: 156 },
					].map((item, index) => (
						<div key={index} className="flex items-center justify-between pb-3 border-b border-border/10">
							<div className="flex items-center gap-3">
								<div className="w-6 h-6 rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan flex items-center justify-center text-xs font-medium">
									{index + 1}
								</div>
								<p>{item.query}</p>
							</div>
							<p className="text-sm text-muted-foreground">{item.count} queries</p>
						</div>
					))}
				</div>
			</GlassCard>
		</div>
	);
}