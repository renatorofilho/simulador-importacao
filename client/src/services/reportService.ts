interface Item {
  description: string;
  quantity: number;
  unitValueUsd: number;
  unitWeight?: number;
  ii: number;
  ipi: number;
  pis: number;
  cofins: number;
  icms: number;
  totalImpostos: number;
}

interface SimulationData {
  name: string;
  regime: string;
  ttd: string;
  incoterm: string;
  cambio: number;
  items: Item[];
  totalValueUsd: number;
  totalImpostos: number;
  totalCIF: number;
  precoDesembaracado: number;
  fatorImportacao: number;
}

export function generateSimulationCSV(data: SimulationData): string {
  let csv = "Simulador de Importacao Pro - Relatorio\n\n";

  csv += "PARAMETROS DA SIMULACAO\n";
  csv += `Simulacao,${data.name}\n`;
  csv += `Regime Tributario,${data.regime}\n`;
  csv += `TTD,${data.ttd || "Nenhum"}\n`;
  csv += `Incoterm,${data.incoterm}\n`;
  csv += `Cambio (USD/BRL),${data.cambio}\n\n`;

  csv += "ITENS IMPORTADOS\n";
  csv += "Descricao,Quantidade,Valor Unitario (USD),Valor Total (USD),II (%),IPI (%),PIS (%),COFINS (%),ICMS (%),Total de Impostos (USD)\n";

  data.items.forEach((item) => {
    csv += `"${item.description}",${item.quantity},${item.unitValueUsd.toFixed(2)},${(item.quantity * item.unitValueUsd).toFixed(2)},${item.ii.toFixed(1)},${item.ipi.toFixed(1)},${item.pis.toFixed(1)},${item.cofins.toFixed(1)},${item.icms.toFixed(1)},${item.totalImpostos.toFixed(2)}\n`;
  });

  csv += "\nRESUMO FINANCEIRO\n";
  csv += `Valor Total (USD),${data.totalValueUsd.toFixed(2)}\n`;
  csv += `Total de Impostos (USD),${data.totalImpostos.toFixed(2)}\n`;
  csv += `Valor CIF (USD),${data.totalCIF.toFixed(2)}\n`;
  csv += `Preco Desembaracado (BRL),${data.precoDesembaracado.toFixed(2)}\n`;
  csv += `Fator de Importacao,${data.fatorImportacao.toFixed(4)}\n`;

  return csv;
}

export function downloadCSV(csv: string, filename: string) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
