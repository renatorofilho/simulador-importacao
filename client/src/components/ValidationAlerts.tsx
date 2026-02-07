import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface ValidationAlertsProps {
  regime: string;
  ttd: string;
  modalTransporte: string;
}

export function ValidationAlerts({
  regime,
  ttd,
  modalTransporte,
}: ValidationAlertsProps) {
  const alerts = [];

  // Alerta de PIS/COFINS zerados
  if (regime === "simples-nacional" || regime === "lucro-presumido") {
    alerts.push({
      type: "warning",
      title: "PIS/COFINS Zerados",
      description: `No regime ${regime === "simples-nacional" ? "Simples Nacional" : "Lucro Presumido"}, PIS e COFINS não são recuperáveis e foram zerados nos cálculos.`,
      icon: AlertCircle,
    });
  }

  // Alerta de AFRMM
  if (modalTransporte === "maritimo") {
    alerts.push({
      type: "info",
      title: "AFRMM Aplicado",
      description: "Adicional ao Frete para Renovação da Marinha Mercante (25% do frete) foi incluído no Valor Aduaneiro.",
      icon: Info,
    });
  }

  // Alerta de TTD
  if (ttd && ttd !== "none") {
    alerts.push({
      type: "success",
      title: "TTD Aplicado",
      description: `Benefícios fiscais do TTD ${ttd} foram aplicados aos cálculos.`,
      icon: CheckCircle,
    });
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const bgColor =
          alert.type === "warning"
            ? "bg-yellow-50 border-yellow-200"
            : alert.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-blue-50 border-blue-200";

        const textColor =
          alert.type === "warning"
            ? "text-yellow-800"
            : alert.type === "success"
            ? "text-green-800"
            : "text-blue-800";

        const Icon = alert.icon;
        const iconColor =
          alert.type === "warning"
            ? "text-yellow-600"
            : alert.type === "success"
            ? "text-green-600"
            : "text-blue-600";

        return (
          <Alert key={idx} className={`${bgColor}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <div>
              <AlertDescription className={`font-semibold ${textColor}`}>
                {alert.title}
              </AlertDescription>
              <AlertDescription className={textColor}>
                {alert.description}
              </AlertDescription>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
