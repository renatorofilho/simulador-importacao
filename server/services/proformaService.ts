/**
 * Serviço para extrair dados de Proforma Invoice
 * Suporta: PDF, Excel, CSV, TXT
 */

export interface ProformaItem {
  sku: string;
  description: string;
  quantity: number;
  unitWeight: number;
  unitVolume: number;
  unitValueUsd: number;
  totalValueUsd: number;
}

export interface ProformaData {
  items: ProformaItem[];
  totalValueUsd: number;
  currency: string;
  supplierName?: string;
  invoiceNumber?: string;
}

/**
 * Extrai dados de um arquivo de Proforma Invoice
 */
export async function extrairProformaInvoice(
  fileContent: Buffer | string,
  fileType: string
): Promise<ProformaData> {
  const type = fileType.toLowerCase();

  switch (type) {
    case "pdf":
      return await extrairDePDF(fileContent as Buffer);
    case "xlsx":
    case "xls":
      return await extrairDeExcel(fileContent as Buffer);
    case "csv":
      return extrairDeCSV(fileContent as string);
    case "txt":
      return extrairDeTXT(fileContent as string);
    default:
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
  }
}

/**
 * Extrai dados de um PDF
 */
async function extrairDePDF(buffer: Buffer): Promise<ProformaData> {
  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    const text = data.text;

    const items = extrairItensDoTexto(text);
    const totalValueUsd = extrairTotalDoTexto(text);

    return {
      items,
      totalValueUsd,
      currency: "USD",
      invoiceNumber: extrairNumeroDaInvoice(text),
      supplierName: extrairNomeDoFornecedor(text),
    };
  } catch (error) {
    console.error("[Proforma] Erro ao extrair PDF:", error);
    throw new Error("Erro ao processar PDF. Certifique-se de que é um documento válido.");
  }
}

/**
 * Extrai dados de um arquivo Excel com detecção automática de colunas
 */
async function extrairDeExcel(buffer: Buffer): Promise<ProformaData> {
  try {
    const XLSX = require("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new Error("Nenhum dado encontrado na planilha");
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Detectar colunas automaticamente
    const ncmKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return lower.includes("ncm") || lower.includes("hs") || lower.includes("code");
    }) || "NCM";

    const qtyKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes("quantidade") ||
        lower.includes("qty") ||
        lower.includes("caixas") ||
        lower.includes("metros") ||
        lower.includes("units") ||
        lower.includes("quantity")
      );
    }) || keys[0];

    const priceKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes("preco") ||
        lower.includes("preço") ||
        lower.includes("price") ||
        lower.includes("usd /") ||
        lower.includes("valor") ||
        lower.includes("unit price")
      );
    }) || keys[1];

    const totalKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        (lower.includes("total") && lower.includes("usd")) ||
        lower.includes("total value") ||
        lower.includes("valor total")
      );
    }) || keys[2];

    const weightKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes("peso") ||
        lower.includes("weight") ||
        lower.includes("kg") ||
        lower.includes("kg/")
      );
    });

    const descKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes("produto") ||
        lower.includes("description") ||
        lower.includes("item") ||
        lower.includes("modelo")
      );
    }) || keys[0];

    console.log("[Proforma] Colunas detectadas:", {
      ncmKey,
      qtyKey,
      priceKey,
      totalKey,
      weightKey,
      descKey,
    });

    // Converter dados
    const items: ProformaItem[] = data
      .map((row: any) => {
        const qty = parseFloat(String(row[ncmKey] || 0).replace(",", ".")) || 0;
        const unitPrice =
          parseFloat(String(row[priceKey] || 0).replace(",", ".")) || 0;
        const totalValue =
          parseFloat(String(row[totalKey] || 0).replace(",", ".")) ||
          qty * unitPrice;
        const totalWeight = weightKey
          ? parseFloat(String(row[weightKey] || 0).replace(",", ".")) || 0
          : 0;
        const unitWeight = qty > 0 ? totalWeight / qty : 0;
        const ncm = String(row[ncmKey] || "").replace(/\D/g, "").slice(0, 8);

        return {
          sku: ncm,
          description: String(row[descKey] || "").trim(),
          quantity: qty,
          unitWeight: Math.max(0, unitWeight),
          unitVolume: 0,
          unitValueUsd: Math.max(0, unitPrice),
          totalValueUsd: Math.max(0, totalValue),
        };
      })
      .filter(
        (item: ProformaItem) =>
          (item.quantity > 0 && item.totalValueUsd > 0) ||
          (item.sku && item.description)
      );

    const totalValueUsd = items.reduce(
      (sum: number, item: ProformaItem) => sum + item.totalValueUsd,
      0
    );

    return {
      items,
      totalValueUsd,
      currency: "USD",
    };
  } catch (error) {
    console.error("[Proforma] Erro ao extrair Excel:", error);
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    throw new Error(`Erro ao processar arquivo Excel: ${errorMsg}`);
  }
}

/**
 * Extrai dados de um arquivo CSV
 */
function extrairDeCSV(content: string): ProformaData {
  try {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("Arquivo CSV vazio ou inválido");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const ncmIndex = headers.findIndex((h) =>
      h.includes("ncm") || h.includes("hs")
    );
    const qtyIndex = headers.findIndex((h) =>
      h.includes("qty") || h.includes("quantidade")
    );
    const priceIndex = headers.findIndex((h) =>
      h.includes("price") || h.includes("preco")
    );

    const items: ProformaItem[] = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return {
          sku: ncmIndex >= 0 ? values[ncmIndex] : "",
          description: values[0] || "",
          quantity: qtyIndex >= 0 ? parseFloat(values[qtyIndex]) || 0 : 0,
          unitWeight: 0,
          unitVolume: 0,
          unitValueUsd: priceIndex >= 0 ? parseFloat(values[priceIndex]) || 0 : 0,
          totalValueUsd:
            (qtyIndex >= 0 ? parseFloat(values[qtyIndex]) || 0 : 0) *
            (priceIndex >= 0 ? parseFloat(values[priceIndex]) || 0 : 0),
        };
      })
      .filter((item) => item.quantity > 0 || item.totalValueUsd > 0);

    const totalValueUsd = items.reduce(
      (sum, item) => sum + item.totalValueUsd,
      0
    );

    return {
      items,
      totalValueUsd,
      currency: "USD",
    };
  } catch (error) {
    console.error("[Proforma] Erro ao extrair CSV:", error);
    throw new Error("Erro ao processar arquivo CSV");
  }
}

/**
 * Extrai dados de um arquivo TXT
 */
function extrairDeTXT(content: string): ProformaData {
  try {
    const items: ProformaItem[] = [];
    const lines = content.split("\n");

    // Padrão simples: NCM|Descrição|Quantidade|Valor
    const pattern = /(\d{8})\s*\|\s*(.+?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      items.push({
        sku: match[1],
        description: match[2].trim(),
        quantity: parseFloat(match[3]) || 0,
        unitWeight: 0,
        unitVolume: 0,
        unitValueUsd: parseFloat(match[4]) || 0,
        totalValueUsd:
          (parseFloat(match[3]) || 0) * (parseFloat(match[4]) || 0),
      });
    }

    const totalValueUsd = items.reduce(
      (sum, item) => sum + item.totalValueUsd,
      0
    );

    return {
      items,
      totalValueUsd,
      currency: "USD",
    };
  } catch (error) {
    console.error("[Proforma] Erro ao extrair TXT:", error);
    throw new Error("Erro ao processar arquivo TXT");
  }
}

/**
 * Funções auxiliares para extrair dados de texto
 */
function extrairItensDoTexto(text: string): ProformaItem[] {
  const items: ProformaItem[] = [];
  const lines = text.split("\n");

  // Procurar por padrões de NCM (8 dígitos)
  const ncmPattern = /(\d{8})/g;
  const matches = text.matchAll(ncmPattern);

  const matchArray = Array.from(matches);
  for (const match of matchArray) {
    items.push({
      sku: match[1],
      description: "Item extraído do PDF",
      quantity: 1,
      unitWeight: 0,
      unitVolume: 0,
      unitValueUsd: 0,
      totalValueUsd: 0,
    });
  }

  return items;
}

function extrairTotalDoTexto(text: string): number {
  const pattern = /total.*?(\d+[.,]\d{2})/i;
  const match = text.match(pattern);
  return match ? parseFloat(match[1].replace(",", ".")) : 0;
}

function extrairNumeroDaInvoice(text: string): string {
  const pattern = /invoice.*?(\d+)/i;
  const match = text.match(pattern);
  return match ? match[1] : "";
}

function extrairNomeDoFornecedor(text: string): string {
  const lines = text.split("\n");
  return lines[0] || "";
}
