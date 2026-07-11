import { useState, useRef } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetAlertById, useUpdateAlertStatus, useAddAlertComment, getGetAlertByIdQueryKey } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getSeverityBadgeVariant, getStatusBadgeVariant } from '@/lib/theme';
import { ArrowLeft, Clock, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AlertDetail() {
  const [, params] = useRoute('/alerts/:id');
  const id = params?.id || '';
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alert, isLoading } = useGetAlertById(id, {
    query: { enabled: !!id, queryKey: getGetAlertByIdQueryKey(id) }
  });

  const updateStatus = useUpdateAlertStatus();
  const addComment = useAddAlertComment();

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (newStatus: 'open' | 'escalated' | 'resolved') => {
    updateStatus.mutate(
      { id, data: { status: newStatus, actor: 'Current User' } },
      {
        onSuccess: (updatedAlert) => {
          toast({ title: 'Status Updated', description: `Alert is now ${newStatus}` });
          queryClient.setQueryData(getGetAlertByIdQueryKey(id), (old: any) => 
            old ? { ...old, status: updatedAlert.status } : old
          );
          // Invalidate to refresh audit logs
          queryClient.invalidateQueries({ queryKey: getGetAlertByIdQueryKey(id) });
        }
      }
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    addComment.mutate(
      { id, data: { actor: 'Current User', notes: commentText } },
      {
        onSuccess: () => {
          setCommentText('');
          toast({ title: 'Comment Added' });
          queryClient.invalidateQueries({ queryKey: getGetAlertByIdQueryKey(id) });
        },
        onSettled: () => setIsSubmitting(false)
      }
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading alert details...</div>;
  }

  if (!alert) {
    return <div className="p-8 text-center text-destructive">Alert not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/alerts">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">{alert.id}</Badge>
            <span className="text-muted-foreground text-sm">{new Date(alert.createdAt).toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === 'bn' ? alert.titleBn : alert.title}
          </h1>
        </div>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm uppercase tracking-wider mb-1">Decision Support Only</p>
          <p className="text-sm">{t('system_disclaimer')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle>Issue Details</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityBadgeVariant(alert.severity)}>
                    Severity: {alert.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={getStatusBadgeVariant(alert.status)}>
                    Status: {alert.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reason</h3>
                <p className="text-lg leading-relaxed">
                  {locale === 'bn' ? alert.reasonBn : alert.reason}
                </p>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 font-sans">System Evidence</h3>
                {alert.evidence}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t('recommended_steps')}
                </h3>
                <ul className="space-y-2">
                  {(locale === 'bn' ? alert.recommendedStepsBn : alert.recommendedSteps).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50 border border-secondary">
                      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center shrink-0 border text-xs font-bold shadow-sm">
                        {idx + 1}
                      </div>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {alert.relatedTransactions && alert.relatedTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('related_tx')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left font-medium">ID</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {alert.relatedTransactions.map(tx => (
                      <tr key={tx.id} className={tx.flagged ? 'bg-red-500/5' : ''}>
                        <td className="p-3 font-mono text-xs">{tx.id.split('-')[0]}...</td>
                        <td className="p-3 capitalize">{tx.type.replace('_', ' ')}</td>
                        <td className="p-3 font-mono font-medium">{formatCurrency(tx.amount)}</td>
                        <td className="p-3">{tx.agentName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Activity & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea 
                  placeholder="Add notes, observations, or field updates..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !commentText.trim()}>
                    Post Comment
                  </Button>
                </div>
              </form>

              <div className="space-y-4 pt-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-border before:mt-6 before:mb-2">
                {alert.auditLogs?.map(log => (
                  <div key={log.id} className="relative flex gap-4 pl-12">
                    <div className="absolute left-0 w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center shadow-sm z-10 text-muted-foreground">
                      {log.action === 'status_changed' ? <ShieldCheck className="w-4 h-4" /> : 
                       log.action === 'comment_added' ? <MessageSquare className="w-4 h-4" /> : 
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 bg-muted/30 p-4 rounded-lg border text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-foreground">{log.actor}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className="capitalize text-muted-foreground font-medium">{log.action.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.action === 'status_changed' ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{log.previousStatus}</Badge>
                          <span>→</span>
                          <Badge variant="outline">{log.newStatus}</Badge>
                        </div>
                      ) : (
                        <p className="mt-1 leading-relaxed whitespace-pre-wrap">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Provider</h3>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-card">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: alert.providerColor }} />
                  <span className="font-semibold">{alert.providerName}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Assigned To</h3>
                <div className="p-3 border rounded-md bg-muted/30">
                  <div className="font-medium">{alert.assignedRole}</div>
                  <div className="text-sm text-muted-foreground mt-1">{alert.assignedTo || 'Unassigned'}</div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Update Status</h3>
                {alert.status !== 'open' && (
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange('open')}>
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" /> Re-open Alert
                  </Button>
                )}
                {alert.status !== 'escalated' && (
                  <Button variant="outline" className="w-full justify-start border-red-200 hover:bg-red-50" onClick={() => handleStatusChange('escalated')}>
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Escalate to High Priority
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange('resolved')}>
                    <div className="w-2 h-2 rounded-full bg-white/50 mr-2" /> Mark as Resolved
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
