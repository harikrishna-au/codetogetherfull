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
    iconColor = 'text-primary',
}: StatCardProps) => {
    if (loading) {
        return (
            <Card className={`bg-card/50 border border-border/30 ${className}`}>
                <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg bg-muted/40" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-16 bg-muted/40" />
                            <Skeleton className="h-6 w-12 bg-muted/40" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-card/50 border border-border/40 backdrop-blur-sm hover:bg-card/70 hover:border-border/60 transition-all duration-300 shadow-sm hover:shadow-md ${className}`}>
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-primary/10 border border-primary/20 ${iconColor} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                        <h3 className="text-2xl font-bold text-foreground leading-tight">{value}</h3>
                        {subtitle && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
