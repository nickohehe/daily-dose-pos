import { useOrderStore } from '@/store/orderStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ReadyOrdersSheet() {
    const { orders, updateOrderStatus } = useOrderStore();

    // Filter for orders that are 'ready'
    const readyOrders = orders.filter((o) => o.status === 'ready');

    if (readyOrders.length === 0) return null;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="relative gap-2 border-warning text-warning hover:bg-warning/10">
                    <Bell className="w-5 h-5 animate-pulse" />
                    <span className="hidden sm:inline">Ready for Pickup</span>
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                        {readyOrders.length}
                    </Badge>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Ready for Pickup</SheetTitle>
                    <SheetDescription>
                        Mark orders as completed when handing them to the customer.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
                    <div className="space-y-4">
                        {readyOrders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 bg-card shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{order.id}</h3>
                                        {order.tableNumber && (
                                            <p className="text-sm text-muted-foreground">Table {order.tableNumber}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="text-sm flex justify-between">
                                            <span>{item.quantity}x {item.menuItem.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full bg-success hover:bg-success/90 text-white"
                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Complete Order
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
