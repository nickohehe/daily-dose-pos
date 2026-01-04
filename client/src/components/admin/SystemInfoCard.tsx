
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface SystemInfoCardProps {
    lastClosed?: string;
}

export function SystemInfoCard({ lastClosed }: SystemInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>System Info</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Server Status:</span>
                        <span className="text-success font-medium">Online</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Data Storage:</span>
                        <span className="font-mono">PostgreSQL</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Last Closed:</span>
                        <span className="font-medium">
                            {lastClosed
                                ? format(new Date(lastClosed), 'PPP p')
                                : 'Never'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
