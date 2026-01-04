import { useOrderStore } from '@/store/orderStore';
import { Card, CardContent } from '@/components/ui/card';
import { Banknote, ShoppingBag } from 'lucide-react';

export function DailyStats() {
    const { orders } = useOrderStore();

    // Filter for orders created today
    const today = new Date().toLocaleDateString();
    const todayOrders = orders.filter(o =>
        new Date(o.createdAt).toLocaleDateString() === today
    );

    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const totalCount = todayOrders.length;

    return (
        <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Daily Orders</p>
                        <p className="text-2xl font-bold">{totalCount}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-primary opacity-50" />
                </CardContent>
            </Card>

            <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Daily Sales</p>
                        <p className="text-2xl font-bold">₱{totalSales.toFixed(2)}</p>
                    </div>
                    <Banknote className="h-8 w-8 text-primary opacity-50" />
                </CardContent>
            </Card>
        </div>
    );
}
