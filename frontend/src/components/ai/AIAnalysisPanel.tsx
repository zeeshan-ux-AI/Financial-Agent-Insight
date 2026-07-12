import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/api-url';

interface AIAnalysisResult {
  alertId: string;
  analysis: string;
  model: string;
  generatedAt: string;
}

interface Props {
  alertId: string;
}

export function AIAnalysisPanel({ alertId }: Props) {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`ai/analyze-alert/${alertId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as AIAnalysisResult;
      setResult(data);
      setExpanded(true);
    } catch (e) {
      setError('AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown renderer for numbered lists and bold
  const renderAnalysis = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Heading lines like "1. **Title** — ..."
      const headingMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*[—-]?\s*(.*)/);
      if (headingMatch) {
        return (
          <div key={i} className="mb-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {headingMatch[1]}
              </span>
              <div>
                <p className="font-semibold text-sm">{headingMatch[2]}</p>
                {headingMatch[3] && <p className="text-sm text-muted-foreground mt-0.5">{headingMatch[3]}</p>}
              </div>
            </div>
          </div>
        );
      }
      // Bold inline text
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : <span key={j}>{part}</span>
      );
      return line.trim() ? <p key={i} className="text-sm leading-relaxed mb-1.5">{rendered}</p> : <div key={i} className="h-2" />;
    });
  };

  if (!result && !loading) {
    return (
      <div className="border border-dashed border-primary/30 rounded-xl p-5 bg-primary/5 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">AI Deep Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">
            GPT will assess severity, identify patterns, and provide actionable recommendations based on this alert's data.
          </p>
        </div>
        <Button onClick={runAnalysis} size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Run AI Analysis
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border rounded-xl p-5 bg-muted/20 flex flex-col items-center gap-3 text-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <div>
          <p className="font-semibold text-sm">Analyzing alert...</p>
          <p className="text-xs text-muted-foreground">GPT is reviewing evidence and transaction patterns</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={runAnalysis}>
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Analysis</span>
          <span className="text-xs text-muted-foreground font-mono">{result!.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date(result!.generatedAt).toLocaleTimeString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
            title="Regenerate"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-1">
          <div className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            AI-generated analysis is decision support only. Human judgment required before any action.
          </div>
          {renderAnalysis(result!.analysis)}
        </div>
      )}
    </div>
  );
}
