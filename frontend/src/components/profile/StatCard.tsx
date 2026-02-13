import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subtitle?: string;
    loading?: boolean;
    className?: string;
    iconColor?: string;
}

export const StatCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    loading = false,
    className = '',
    iconColor = 'text-purple-400'
}: StatCardProps) => {
    if (loading) {
        return (
            <Card className={`bg-white/5 border-white/10 ${className}`}>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 bg-white/10" />
                            <Skeleton className="h-8 w-16 bg-white/10" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 transition-colors ${className}`}>
            <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-white/5 ${iconColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">{label}</p>
                        <h3 className="text-2xl font-bold text-white">{value}</h3>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
