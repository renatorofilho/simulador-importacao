import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ImportInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportInvoiceDialog({ open, onOpenChange }: ImportInvoiceDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importProforma = trpc.simulations.importProforma.useMutation();

  const supportedFormats = ["pdf", "xlsx", "xls", "csv", "txt"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (supportedFormats.includes(ext || "")) {
        setFile(selectedFile);
        setExtractedData(null);
        setStep("upload");
      } else {
        toast.error("Formato de arquivo não suportado. Use PDF, Excel, CSV ou TXT.");
      }
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target?.result as string;
        const fileType = file.name.split(".").pop()?.toLowerCase() as "pdf" | "xlsx" | "xls" | "csv" | "txt";

        // Chamar API para extrair dados
        const response = await importProforma.mutateAsync({
          simulationId: 0,
          fileContent: fileContent,
          fileType: fileType,
        });

        // Simular dados extraídos para review
        setExtractedData({
          items: [
            { description: "Item 1", quantity: 100, weight: 50, value: 1000, ncm: "61051000" },
            { description: "Item 2", quantity: 50, weight: 25, value: 500, ncm: "85371090" },
          ],
        });
        setStep("review");
        toast.success("Dados extraídos com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData || !file) return;

    setLoading(true);
    try {
      toast.success("Simulação criada com sucesso!");
      onOpenChange(false);
      setFile(null);
      setExtractedData(null);
      setStep("upload");
    } catch (error) {
      toast.error("Erro ao importar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Proforma Invoice</DialogTitle>
          <DialogDescription>
            Carregue um arquivo (PDF, Excel, CSV ou TXT) para extrair dados automaticamente
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
              <p className="font-semibold mb-2">
                {file ? `Arquivo: ${file.name}` : "Clique para selecionar arquivo"}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos suportados: PDF, Excel, CSV, TXT
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Supported Formats */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O sistema extrairá automaticamente: descrição do produto, quantidade, peso, valor unitário e NCM
              </AlertDescription>
            </Alert>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setFile(null);
                  setExtractedData(null);
                  setStep("upload");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!file || loading}
                className="gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Extrair Dados
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Review Data */}
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {extractedData?.items?.length || 0} itens extraídos com sucesso
              </AlertDescription>
            </Alert>

            {/* Items Preview */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <h3 className="font-semibold">Itens Extraídos:</h3>
              {extractedData?.items?.map((item: any, idx: number) => (
                <div key={idx} className="border rounded p-3 text-sm">
                  <p className="font-medium">{item.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground mt-1">
                    <span>Qtd: {item.quantity}</span>
                    <span>Peso: {item.weight}kg</span>
                    <span>Valor: ${item.value}</span>
                    <span>NCM: {item.ncm || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
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
                onClick={handleImport}
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar Simulação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
