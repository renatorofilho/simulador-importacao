import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface RegimeTaxBadgeProps {
  regime: "simples-nacional" | "lucro-real" | "lucro-presumido";
  showDetails?: boolean;
}

export function RegimeTaxBadge({ regime, showDetails = true }: RegimeTaxBadgeProps) {
  const getRegimeInfo = () => {
    switch (regime) {
      case "simples-nacional":
        return {
          label: "Simples Nacional",
          color: "bg-yellow-100 text-yellow-800 border-yellow-300" as const,
          icon: AlertCircle,
          warning: "PIS e COFINS zerados",
          description: "No Simples Nacional, PIS e COFINS não são recuperáveis na importação. Os valores são zerados automaticamente nos cálculos.",
        };
      case "lucro-presumido":
        return {
          label: "Lucro Presumido",
          color: "bg-orange-100 text-orange-800 border-orange-300" as const,
          icon: AlertCircle,
          warning: "PIS e COFINS zerados",
          description: "No Lucro Presumido, PIS e COFINS não são recuperáveis na importação. Os valores são zerados automaticamente nos cálculos.",
        };
      case "lucro-real":
        return {
          label: "Lucro Real",
          color: "bg-green-100 text-green-800 border-green-300" as const,
          icon: CheckCircle2,
          warning: "Todos os créditos recuperáveis",
          description: "No Lucro Real, todos os impostos (II, IPI, PIS, COFINS, ICMS) são recuperáveis como crédito tributário.",
        };
    }
  };

  const info = getRegimeInfo();
  const Icon = info.icon;

  if (!showDetails) {
    return (
      <Badge variant="outline" className={info.color}>
        {info.label}
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-2">
          <Badge variant="outline" className={`${info.color} cursor-help`}>
            <Icon className="w-3 h-3 mr-1" />
            {info.warning}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-2">
          <p className="font-medium">{info.label}</p>
          <p className="text-sm">{info.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface TaxInfoCardProps {
  regime: "simples-nacional" | "lucro-real" | "lucro-presumido";
  ttd: "none" | "409" | "410";
}

export function TaxInfoCard({ regime, ttd }: TaxInfoCardProps) {
  const getTTDInfo = () => {
    switch (ttd) {
      case "409":
        return {
          label: "TTD 409 (SC)",
          description: "Diferimento do ICMS na entrada. O ICMS é diferido para a saída, reduzindo o custo imediato da importação.",
          benefit: regime === "simples-nacional" 
            ? "Diferimento não aplicável no Simples Nacional" 
            : "Diferimento total do ICMS",
        };
      case "410":
        return {
          label: "TTD 410 (SC)",
          description: "Redução de 75% do ICMS na importação.",
          benefit: regime === "simples-nacional"
            ? "Redução de 75% do ICMS"
            : "Redução de 75% + crédito do restante",
        };
      default:
        return null;
    }
  };

  const ttdInfo = getTTDInfo();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-medium text-blue-900">Regime Tributário</p>
            <RegimeTaxBadge regime={regime} showDetails={true} />
          </div>
          
          {ttdInfo && (
            <div className="pt-2 border-t border-blue-200">
              <p className="font-medium text-blue-900 mb-1">{ttdInfo.label}</p>
              <p className="text-sm text-blue-700">{ttdInfo.description}</p>
              <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800 border-blue-300">
                {ttdInfo.benefit}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
