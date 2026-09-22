import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopySummaryButtonProps {
  text: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
}

export default function CopySummaryButton({ text, label, copiedLabel, failedLabel }: CopySummaryButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setFeedback(copiedLabel);
    } catch {
      setFeedback(failedLabel);
    }
  };

  return <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void copy()}><Copy className="mr-2 h-4 w-4" />{label}</Button>{feedback ? <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{feedback}</p> : null}</div>;
}
