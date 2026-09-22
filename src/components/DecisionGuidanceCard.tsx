import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DecisionGuidanceCardProps {
  title: string;
  points: string[];
  disclaimer: string;
  learnMore: string;
  href: string;
}

export default function DecisionGuidanceCard({ title, points, disclaimer, learnMore, href }: DecisionGuidanceCardProps) {
  return <Card className="border-primary/20 bg-primary/5"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-primary" />{title}</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><ul className="space-y-2 text-muted-foreground">{points.map((point) => <li key={point} className="flex gap-2"><span aria-hidden="true">•</span><span>{point}</span></li>)}</ul><CardDescription>{disclaimer}</CardDescription><Link to={href} className="inline-flex items-center gap-2 font-medium text-primary hover:underline">{learnMore}<ArrowRight className="h-4 w-4" /></Link></CardContent></Card>;
}
