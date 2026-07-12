import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Provider } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/utils';
import { getLiquidityColor } from '@/lib/theme';
import { Progress } from '@/components/ui/progress';
import { Wallet, Users, AlertCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { t } = useLocale();
  const liquidityRatioPct = Math.min(Math.max(provider.liquidityRatio * 100, 0), 100);
  const progressColor = getLiquidityColor(liquidityRatioPct);

  return (
    <Card className="overflow-hidden hover-elevate transition-shadow border-l-4" style={{ borderLeftColor: provider.colorCode }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: provider.colorCode }} />
            {provider.displayName}
          </CardTitle>
          {provider.activeAlerts > 0 && (
            <span className="flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              {provider.activeAlerts} {t('alerts')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center">
              <Wallet className="w-3 h-3 mr-1" /> E-Money
            </span>
            <div className="font-mono text-sm font-semibold">{formatCurrency(provider.eMoneyBalance)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center">
              <Wallet className="w-3 h-3 mr-1" /> Physical
            </span>
            <div className="font-mono text-sm font-semibold">{formatCurrency(provider.physicalCashBalance)}</div>
          </div>
        </div>
        
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('liquidity_ratio')}</span>
            <span className="font-mono font-medium">{(provider.liquidityRatio * 100).toFixed(1)}%</span>
          </div>
          <Progress value={liquidityRatioPct} indicatorColor={progressColor} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" /> {provider.totalAgents.toLocaleString()} Agents
          </span>
          <span className="uppercase text-[10px] tracking-wider font-semibold" style={{ color: provider.status === 'critical' ? 'var(--destructive)' : 'inherit' }}>
            {provider.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
