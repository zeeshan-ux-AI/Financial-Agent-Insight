import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionStat } from '@workspace/api-client-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface TransactionVolumeChartProps {
  data: TransactionStat[];
}

export function TransactionVolumeChart({ data }: TransactionVolumeChartProps) {
  const { t } = useLocale();
  
  const chartData = useMemo(() => {
    // Group by period (hour)
    const grouped = data.reduce((acc, curr) => {
      const timeStr = new Date(curr.period).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!acc[timeStr]) {
        acc[timeStr] = { time: timeStr, total: 0 };
      }
      acc[timeStr][curr.providerName] = curr.volume;
      acc[timeStr].total += curr.volume;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  }, [data]);

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader>
        <CardTitle>{t('tx_volume_24h')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(val) => `৳${(val / 1000000).toFixed(0)}M`}
                width={80}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'Volume']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
