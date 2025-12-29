import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onMaintenance(status: boolean) {
            setIsMaintenance(status);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('maintenance', onMaintenance);

        // Initial check if possible, or wait for event
        // Ideally we'd fetch this status on mount, but for now socket event pushes will handle updates.

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('maintenance', onMaintenance);
        };
    }, []);

    if (isMaintenance) {
        return (
            <div className="flex items-center">
                <Badge
                    variant="outline"
                    className="gap-1.5 bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse transition-colors duration-300"
                >
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Maintenance</span>
                </Badge>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            <Badge
                variant="outline"
                className={cn(
                    "gap-1.5 transition-colors duration-300",
                    isConnected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                )}
            >
                {isConnected ? (
                    <>
                        <Wifi className="w-3 h-3" />
                        <span className="hidden sm:inline">Online</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-3 h-3" />
                        <span className="hidden sm:inline">Offline</span>
                    </>
                )}
            </Badge>
        </div>
    );
}
