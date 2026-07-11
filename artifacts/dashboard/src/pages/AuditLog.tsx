import { useGetAuditLogs } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldCheck, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'wouter';

export default function AuditLog() {
  const { t } = useLocale();
  const { data: logs, isLoading } = useGetAuditLogs({ limit: 100 });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'status_changed': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'created': return <Plus className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('audit_log')}</h1>
        <p className="text-muted-foreground text-sm mt-1">Immutable record of all operational actions and notes</p>
      </div>

      <Card>
        <CardHeader className="bg-muted/20 border-b">
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Alert</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading logs...</TableCell>
                </TableRow>
              ) : !logs?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No activity found</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.actor}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="capitalize text-sm font-medium">{log.action.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/alerts/${log.alertId}`} className="text-primary hover:underline font-mono text-xs">
                        {log.alertId.split('-')[0]}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[400px] truncate">
                        {log.action === 'status_changed' ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] py-0">{log.previousStatus}</Badge>
                            <span className="text-muted-foreground text-xs">→</span>
                            <Badge variant="outline" className="text-[10px] py-0 bg-primary/5">{log.newStatus}</Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{log.notes || '-'}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
