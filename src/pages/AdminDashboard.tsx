
import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderStore } from '@/store/orderStore';
import { useMenuStore } from '@/store/menuStore';
import { toast } from 'sonner';
import { LayoutDashboard } from "lucide-react";
import { CurrentSessionCard } from '@/components/admin/CurrentSessionCard';
import { SystemInfoCard } from '@/components/admin/SystemInfoCard';
import { HistoryTable } from '@/components/admin/HistoryTable';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { MenuManagement } from '@/components/admin/MenuManagement';
import { HistoryDialog } from '@/components/admin/HistoryDialog';
import { AnalyticsData, HistoryItem, DetailedHistory } from '@/types/pos';
import { socket } from '@/lib/socket';

export default function AdminDashboard() {
    // Stores
    const { fetchOrders } = useOrderStore();
    const { fetchMenu } = useMenuStore();

    // Local State
    const [stats, setStats] = useState({ orders: 0, sales: 0 });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<DetailedHistory | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({ topItems: [], dailyTotals: [], hourlyStats: [] });
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'week' | 'month'>('week');
    const [isLoadingClose, setIsLoadingClose] = useState(false);
    const [sessionStatus, setSessionStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');

    // Fetch Data Functions
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/status`);
            if (res.ok) {
                const data = await res.json();
                setSessionStatus(data.status);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/history`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Could not load history');
        }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/analytics?period=${analyticsPeriod}`);
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const data = await res.json();
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Could not load analytics');
        }
    }, [analyticsPeriod]);

    // Initial Load & Socket Listeners
    useEffect(() => {
        fetchStatus();
        fetchHistory();
        fetchAnalytics();
        fetchMenu();
        fetchOrders(); // Initial fetch

        socket.on('order:update', () => {
            fetchOrders();
            fetchAnalytics();
        });

        socket.on('order:new', () => {
            fetchOrders();
            fetchAnalytics();
        });

        return () => {
            socket.off('order:update');
            socket.off('order:new');
        };
    }, [fetchStatus, fetchHistory, fetchAnalytics, fetchMenu, fetchOrders]);

    // Live Stats Calculation (derived from orderStore)
    // We use the store's active orders to calculate current session stats
    const activeOrders = useOrderStore(state => state.orders);

    useEffect(() => {
        // Calculate stats from active orders for the "Current Session"
        const sessionStats = activeOrders.reduce((acc, order) => {
            if (order.status !== 'cancelled') {
                acc.orders += 1;
                acc.sales += order.total;
            }
            return acc;
        }, { orders: 0, sales: 0 });
        setStats(sessionStats);
    }, [activeOrders]);


    // Handlers
    const handleOpenDay = async () => {
        setIsLoadingClose(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/open-day`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Failed to open session');

            toast.success('Session Opened');
            fetchStatus();
        } catch (error) {
            console.error('Error opening day:', error);
            toast.error('Failed to open session');
        } finally {
            setIsLoadingClose(false);
        }
    };

    const handleCloseDay = async () => {
        setIsLoadingClose(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/close-day`, {
                method: 'POST'
            });

            if (!res.ok) throw new Error('Failed to close day');

            const result = await res.json();
            toast.success(`Session closed! Archived ${result.summary.date}`);

            // Refresh data
            fetchStatus();
            fetchHistory();
            fetchAnalytics();
            useOrderStore.getState().fetchOrders(); // Clear active orders locally
            setStats({ orders: 0, sales: 0 });

        } catch (error) {
            console.error('Error closing day:', error);
            toast.error('Failed to close session');
        } finally {
            setIsLoadingClose(false);
        }
    };

    const handleViewHistory = async (filename: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/history/${filename}`);
            if (!res.ok) throw new Error('Failed to fetch history details');

            const data = await res.json();
            setSelectedHistory(data);
            setIsHistoryOpen(true);
        } catch (error) {
            console.error('Error fetching history detail:', error);
            toast.error('Could not load history details');
        }
    };

    const lastClosed = history.length > 0 ? history[0].closedAt : undefined;

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-in fade-in duration-500">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-2 md:gap-3">
                <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                Admin Dashboard
            </h1>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="menu">Menu</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Current Session Stats */}
                        <div className="md:col-span-2">
                            <CurrentSessionCard
                                stats={stats}
                                isLoading={isLoadingClose}
                                status={sessionStatus}
                                onCloseDay={handleCloseDay}
                                onOpenDay={handleOpenDay}
                            />
                        </div>

                        {/* System Status */}
                        <SystemInfoCard lastClosed={lastClosed} />
                    </div>

                    {/* History Table */}
                    <HistoryTable
                        history={history}
                        onViewHistory={handleViewHistory}
                    />
                </TabsContent>

                {/* ANALYTICS TAB */}
                <TabsContent value="analytics">
                    <AnalyticsTab
                        analytics={analyticsData}
                        period={analyticsPeriod}
                        setPeriod={setAnalyticsPeriod}
                    />
                </TabsContent>

                {/* MENU TAB */}
                <TabsContent value="menu">
                    <MenuManagement />
                </TabsContent>
            </Tabs>

            {/* History Details Dialog */}
            <HistoryDialog
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                data={selectedHistory}
            />
        </div>
    );
}
