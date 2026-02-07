import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProformaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationId: number;
  onImportSuccess?: () => void;
}

export function ProformaImportDialog({
  open,
  onOpenChange,
  simulationId,
  onImportSuccess,
}: ProformaImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [step, setStep] = useState<"upload" | "review" | "confirm">("upload");

  const importProforma = trpc.simulations.importProforma.useMutation();

  const supportedFormats = ["pdf", "xlsx", "xls", "csv", "txt"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (supportedFormats.includes(ext || "")) {
        setFile(selectedFile);
        setExtractedData(null);
      } else {
        toast.error("Formato de arquivo não suportado. Use PDF, Excel, CSV ou TXT.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split(".").pop()?.toLowerCase();
      if (supportedFormats.includes(ext || "")) {
        setFile(droppedFile);
        setExtractedData(null);
      } else {
        toast.error("Formato de arquivo não suportado. Use PDF, Excel, CSV ou TXT.");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setLoading(true);
    try {
      const fileType = file.name.split(".").pop()?.toLowerCase() as
        | "pdf"
        | "xlsx"
        | "xls"
        | "csv"
        | "txt";

      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];

        try {
          const result = await importProforma.mutateAsync({
            simulationId,
            fileContent: base64,
            fileType,
          });

          setExtractedData(result);
          setStep("review");
          toast.success(result.message);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro ao processar arquivo";
          toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) {
      toast.error("Nenhum item para importar");
      return;
    }

    toast.success(extractedData.message);
    setStep("upload");
    setFile(null);
    setExtractedData(null);
    onOpenChange(false);
    onImportSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Proforma Invoice</DialogTitle>
          <DialogDescription>
            Carregue um documento (PDF, Excel, CSV ou TXT) com os dados dos itens
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition cursor-pointer"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formatos suportados: PDF, Excel, CSV, TXT
              </p>
              <Input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Button variant="outline" className="mt-4" asChild>
                  <span>Selecionar arquivo</span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">Arquivo selecionado:</p>
                <p className="text-sm text-blue-700">{file.name}</p>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O documento deve conter uma tabela com colunas: SKU/Item, Descrição, Quantidade,
                Peso, Preço Unitário e Total.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "review" && extractedData && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">
                ✓ {extractedData.items.length} itens encontrados
              </p>
              {extractedData.invoiceNumber && (
                <p className="text-sm text-green-700">Invoice: {extractedData.invoiceNumber}</p>
              )}
              {extractedData.supplierName && (
                <p className="text-sm text-green-700">Fornecedor: {extractedData.supplierName}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Itens a serem importados:</p>
              <div className="space-y-2">
                {extractedData.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium">{item.sku} - {item.description}</p>
                    <p className="text-gray-600">
                      Qtd: {item.quantity} | Peso: {item.unitWeight}kg | Valor: USD
                      {item.unitValueUsd.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Processar Arquivo"
                )}
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setExtractedData(null);
                }}
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Confirmar Importação"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
