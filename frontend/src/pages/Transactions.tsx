import { useState } from 'react';
import { useGetTransactions, getGetTransactionsQueryKey } from '@workspace/api-client-react';
import { useLocale } from '@/contexts/LocaleContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Filter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Transactions() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [flagged, setFlagged] = useState<string>('');

  const params = {
    ...(providerId ? { providerId } : {}),
    ...(type ? { type } : {}),
    ...(flagged ? { flagged: flagged === 'true' } : {}),
    limit: 50
  };

  const { data: transactionList, isLoading } = useGetTransactions(params);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-500/10';
      case 'failed': return 'text-red-600 bg-red-500/10';
      case 'pending': return 'text-amber-600 bg-amber-500/10';
      default: return 'text-slate-600 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('transactions')}</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time ledger and anomaly tracking</p>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center text-sm font-medium mr-2">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </div>
            
            <select 
              className="h-9 px-3 rounded-md border bg-background text-sm"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              <option value="">All Providers</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
            </select>
            
            <select 
              className="h-9 px-3 rounded-md border bg-background text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="cash_in">Cash In</option>
              <option value="cash_out">Cash Out</option>
              <option value="p2p_transfer">P2P Transfer</option>
              <option value="bill_payment">Bill Payment</option>
            </select>
            
            <select 
              className="h-9 px-3 rounded-md border bg-background text-sm"
              value={flagged}
              onChange={(e) => setFlagged(e.target.value)}
            >
              <option value="">All Flags</option>
              <option value="true">Flagged Only</option>
              <option value="false">Clear Only</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount (BDT)</TableHead>
                <TableHead>Agent / Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading transactions...</TableCell>
                </TableRow>
              ) : !transactionList?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">No transactions found</TableCell>
                </TableRow>
              ) : (
                transactionList.data.map((tx) => (
                  <TableRow key={tx.id} className={tx.flagged ? 'bg-red-500/5 hover:bg-red-500/10' : ''}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs">{tx.providerName}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">{tx.agentName || tx.agentId}</div>
                        <div className="text-muted-foreground">{tx.customerId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize border-transparent ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.flagged && (
                        <div className="flex items-center justify-end text-destructive text-xs font-medium">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {tx.flagReason}
                        </div>
                      )}
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
