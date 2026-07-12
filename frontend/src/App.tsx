import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Shell } from '@/components/layout/Shell';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Alerts from '@/pages/Alerts';
import AlertDetail from '@/pages/AlertDetail';
import AuditLog from '@/pages/AuditLog';
import Settings from '@/pages/Settings';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/alerts/:id" component={AlertDetail} />
        <Route path="/audit-log" component={AuditLog} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
