import { useQueryClient } from '@tanstack/react-query';
import { useGetDashboard, useSeedData, useSimulateAnomaly, getGetDashboardQueryKey, getGetProvidersQueryKey, getGetTransactionsQueryKey, getGetTransactionStatsQueryKey, getGetAlertsQueryKey } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Play, Database, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

export function DashboardActions() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading: isLoadingDashboard } = useGetDashboard();
  const seedData = useSeedData();
  const simulateAnomaly = useSimulateAnomaly();

  const [simDialogOpen, setSimDialogOpen] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [anomalyType, setAnomalyType] = useState<'spike' | 'liquidity_drop' | 'unusual_pattern'>('spike');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProvidersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTransactionStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
  };

  const handleSeed = () => {
    seedData.mutate(
      { data: { reset: true, transactionCount: 50 } },
      {
        onSuccess: () => {
          toast({ title: 'Success', description: 'Synthetic data generated successfully' });
          invalidateAll();
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to seed data', variant: 'destructive' });
        }
      }
    );
  };

  const handleSimulate = () => {
    simulateAnomaly.mutate(
      { data: { providerId: providerId || undefined, anomalyType } },
      {
        onSuccess: (res) => {
          toast({ 
            title: 'Anomaly Simulated', 
            description: res.message || 'New alert generated' 
          });
          setSimDialogOpen(false);
          invalidateAll();
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to simulate anomaly', variant: 'destructive' });
        }
      }
    );
  };

  // Auto seed if empty
  useEffect(() => {
    if (!isLoadingDashboard && dashboard?.providers && dashboard.providers.length === 0 && !seedData.isPending) {
      handleSeed();
    }
  }, [isLoadingDashboard, dashboard?.providers?.length]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSeed}
        disabled={seedData.isPending}
      >
        <Database className="mr-2 h-4 w-4" />
        {seedData.isPending ? 'Seeding...' : t('seed_data')}
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setSimDialogOpen(true)}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        {t('simulate_anomaly')}
      </Button>

      <Dialog open={simDialogOpen} onOpenChange={setSimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulate Anomaly</DialogTitle>
            <DialogDescription>
              Trigger a synthetic operational anomaly to test the decision-support system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
              >
                <option value="">Any Provider</option>
                {dashboard?.providers?.map(p => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Anomaly Type</label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={anomalyType}
                onChange={(e) => setAnomalyType(e.target.value as any)}
              >
                <option value="spike">Transaction Spike</option>
                <option value="liquidity_drop">Sudden Liquidity Drop</option>
                <option value="unusual_pattern">Unusual Agent Pattern</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleSimulate}
              disabled={simulateAnomaly.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {simulateAnomaly.isPending ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
