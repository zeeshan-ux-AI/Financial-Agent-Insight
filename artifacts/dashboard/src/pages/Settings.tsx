import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Shield, Info } from 'lucide-react';

export default function Settings() {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground text-sm mt-1">System preferences and configuration</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <CardTitle>{t('language')}</CardTitle>
            </div>
            <CardDescription>
              Toggle the user interface language. Affects alerts, navigation, and labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button 
              variant={locale === 'en' ? 'default' : 'outline'}
              onClick={() => setLocale('en')}
              className="w-32"
            >
              English
            </Button>
            <Button 
              variant={locale === 'bn' ? 'default' : 'outline'}
              onClick={() => setLocale('bn')}
              className="w-32 font-sans"
            >
              বাংলা
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle>System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 p-4 bg-muted/30 rounded-lg border gap-y-4">
              <div>
                <div className="text-muted-foreground mb-1">Environment</div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Production</Badge>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Version</div>
                <div className="font-mono font-medium">1.0.0-rc.4</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Data Retention</div>
                <div>90 days active, 7 years archive</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Compliance Standard</div>
                <div className="flex items-center gap-1 font-medium">
                  <Shield className="w-4 h-4 text-emerald-600" /> BFIU Reporting Ready
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground mt-4 leading-relaxed">
              This dashboard provides decision-support capabilities for monitoring MFS provider liquidity.
              No automated blocking or fund transfers are executed by this system. All operational actions must be manually confirmed and authenticated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
