import { useState } from 'react';
import { useGetAlerts } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSeverityBadgeVariant, getStatusBadgeVariant } from '@/lib/theme';
import { Link } from 'wouter';
import { AlertCircle, Filter, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Alerts() {
  const { t, locale } = useLocale();
  const [status, setStatus] = useState<string>('open');
  const [type, setType] = useState<string>('');

  const params = {
    ...(status && status !== 'all' ? { status: status as any } : {}),
    ...(type && type !== 'all' ? { type: type as any } : {}),
  };

  const { data: alerts, isLoading } = useGetAlerts(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('alerts')}</h1>
          <p className="text-muted-foreground text-sm mt-1">Operational anomalies and liquidity warnings</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-3 rounded-md flex items-start gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>{t('alert_disclaimer')}</p>
      </div>

      <div className="flex items-center gap-2 mb-6 bg-card p-2 rounded-lg border">
        <div className="px-3 flex items-center text-sm font-medium text-muted-foreground border-r">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </div>
        <div className="flex gap-2 flex-1 overflow-x-auto px-2">
          {['open', 'escalated', 'resolved', 'all'].map((s) => (
            <button
              key={s}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap capitalize ${
                status === s 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-2 self-center shrink-0" />
          {['all', 'liquidity', 'anomaly'].map((t) => (
            <button
              key={t}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap capitalize ${
                type === t || (type === '' && t === 'all')
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => setType(t === 'all' ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading alerts...</div>
        ) : !alerts?.length ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Inbox Zero</h3>
              <p className="text-muted-foreground max-w-sm">
                No alerts match your current filters. Operational status is healthy.
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map(alert => (
            <Card key={alert.id} className="overflow-hidden hover-elevate transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div 
                  className="w-full md:w-2 shrink-0 h-2 md:h-auto" 
                  style={{ backgroundColor: alert.providerColor }} 
                />
                <div className="p-5 flex-1 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusBadgeVariant(alert.status)}>
                        {alert.status.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                        {alert.type === 'anomaly' ? t('requires_review') : alert.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold">
                        {locale === 'bn' ? alert.titleBn : alert.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {locale === 'bn' ? alert.reasonBn : alert.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-semibold">{alert.providerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Assigned:</span>
                        <span className="font-medium bg-muted px-2 py-0.5 rounded">{alert.assignedRole}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex sm:flex-col justify-end gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                    <Link href={`/alerts/${alert.id}`}>
                      <Button className="w-full sm:w-auto">
                        {t('view_details')} <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
