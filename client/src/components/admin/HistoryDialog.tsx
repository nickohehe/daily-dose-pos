
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Banknote, FileText } from "lucide-react";
import { DetailedHistory } from "@/types/pos";

interface HistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: DetailedHistory | null;
}

export function HistoryDialog({ open, onOpenChange, data }: HistoryDialogProps) {

    // Memoized calculation for performance on large datasets
    const productBreakdown = useMemo(() => {
        if (!data) return [];

        const itemMap: Record<string, { name: string; quantity: number; sales: number }> = {};
        data.orders.forEach(order => {
            order.items.forEach(item => {
                const id = item.menuItem.id;
                if (!itemMap[id]) {
                    itemMap[id] = { name: item.menuItem.name, quantity: 0, sales: 0 };
                }
                itemMap[id].quantity += item.quantity;
                itemMap[id].sales += item.quantity * item.menuItem.price;
            });
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    }, [data]);

    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader>
                        <DialogTitle>Daily Sales Report</DialogTitle>
                        <DialogDescription>
                            Data for {format(new Date(data.date), 'PPPP')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-secondary/20 border-0">
                            <CardContent className="p-4 pt-4">
                                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold text-success">₱{data.totalSales.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/20 border-0">
                            <CardContent className="p-4 pt-4">
                                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">{data.totalOrders}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/20 border-0">
                            <CardContent className="p-4 pt-4">
                                <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                                <p className="text-2xl font-bold">
                                    ₱{data.totalOrders > 0
                                        ? (data.totalSales / data.totalOrders).toFixed(2)
                                        : '0.00'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-secondary/20 border-0">
                            <CardContent className="p-4 pt-4">
                                <p className="text-sm font-medium text-muted-foreground">Closed At</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {format(new Date(data.closedAt), 'p')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-primary" />
                                Product Performance
                            </h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead className="text-right">Sold</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productBreakdown.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₱{item.sales.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Order Log
                            </h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.orders.map((order, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {order.timestamp || order.createdAt ? format(new Date(order.timestamp || order.createdAt || 0), 'p') : '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">₱{order.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close Report</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
