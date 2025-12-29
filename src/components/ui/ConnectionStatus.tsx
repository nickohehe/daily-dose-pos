import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

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
