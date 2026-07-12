import { useGetDashboard, useGetTransactionStats, useGetAlerts } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { ProviderCard } from '@/components/dashboard/ProviderCard';
import { TransactionVolumeChart } from '@/components/dashboard/TransactionVolumeChart';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSeverityBadgeVariant, getStatusBadgeVariant } from '@/lib/theme';
import { Link } from 'wouter';

export default function Dashboard() {
  const { t, locale } = useLocale();
  const { data: dashboard, isLoading } = useGetDashboard();
  const { data: stats } = useGetTransactionStats({ period: 'hourly' });
  const { data: recentAlerts } = useGetAlerts({ status: 'open' });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard...</div>;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
          <p className="text-muted-foreground text-sm mt-1">Multi-Provider MFS Liquidity & Operations</p>
        </div>
        <DashboardActions />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="text-primary-foreground/80 text-sm font-medium mb-2">{t('physical_cash')}</div>
            <div className="text-3xl font-mono font-bold">{formatCurrency(dashboard.totalPhysicalCash)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">{t('active_alerts')}</div>
            <div className="text-3xl font-mono font-bold text-destructive">
              {dashboard.alertCounts.open} <span className="text-base font-normal text-muted-foreground ml-1">Open</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">{t('tx_volume_24h')}</div>
            <div className="text-3xl font-mono font-bold">{formatCurrency(dashboard.transactionVolume24h)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground text-sm font-medium mb-2">{t('flagged_tx')}</div>
            <div className="text-3xl font-mono font-bold text-amber-500">
              {dashboard.flaggedCount24h} <span className="text-base font-normal text-muted-foreground ml-1">24h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dashboard.providers.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2">
          {stats && <TransactionVolumeChart data={stats} />}
        </div>

        {/* Recent Alerts */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Action Required</CardTitle>
              <Link href="/alerts" className="text-sm text-primary hover:underline">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-4">
            {recentAlerts?.slice(0, 5).map(alert => (
              <Link key={alert.id} href={`/alerts/${alert.id}`}>
                <div className="block p-3 rounded-lg border hover-elevate transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getSeverityBadgeVariant(alert.severity)} variant="outline">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {locale === 'bn' ? alert.titleBn : alert.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alert.providerColor }} />
                    <span className="text-xs font-medium text-muted-foreground">{alert.providerName}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto py-0">{alert.type}</Badge>
                  </div>
                </div>
              </Link>
            ))}
            {(!recentAlerts || recentAlerts.length === 0) && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No active alerts
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
