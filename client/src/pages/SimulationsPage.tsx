import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Upload, Loader2 } from "lucide-react";
import { ImportInvoiceDialog } from "@/components/ImportInvoiceDialog";

export default function SimulationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    regime: "lucro-real",
    ttd: "none",
    incoterm: "FOB",
    cambio: "5.00",
    freteInternacionalDolar: "0",
    seguroInternacionalDolar: "0",
    ratioMethod: "cif",
  });

  const { data: simulacoes, isLoading, refetch } = trpc.simulations.list.useQuery();
  const createMutation = trpc.simulations.create.useMutation();

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da simulação é obrigatório");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        regime: formData.regime as any,
        ttd: formData.ttd as any,
        incoterm: formData.incoterm,
        cambio: parseFloat(formData.cambio),
        freteInternacionalDolar: parseFloat(formData.freteInternacionalDolar),
        seguroInternacionalDolar: parseFloat(formData.seguroInternacionalDolar),
        ratioMethod: formData.ratioMethod as any,
      });

      toast.success(`Simulação "${result.name}" criada com sucesso!`);
      setFormData({
        name: "",
        description: "",
        regime: "lucro-real",
        ttd: "none",
        incoterm: "FOB",
        cambio: "5.00",
        freteInternacionalDolar: "0",
        seguroInternacionalDolar: "0",
        ratioMethod: "cif",
      });
      setShowManualDialog(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao criar simulação");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Simulações de Importação</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas simulações de custos de importação
        </p>
      </div>

      {/* Seção de Criação - Upload de Invoice ou Manual */}
      {!simulacoes || simulacoes.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Upload de Proforma Invoice */}
          <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Importar Proforma Invoice</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Carregue um arquivo (PDF, Excel, CSV ou TXT) para preencher automaticamente os dados
                </p>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Criar Manualmente */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-gray-600">+</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Criar Manualmente</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure os parâmetros manualmente e adicione itens depois
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowManualDialog(true)}
                >
                  Criar Simulação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={() => setShowImportDialog(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar Proforma Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowManualDialog(true)}
          >
            Criar Simulação Manual
          </Button>
        </div>
      )}

      {/* Dialog de Importação */}
      <ImportInvoiceDialog open={showImportDialog} onOpenChange={setShowImportDialog} />

      {/* Dialog de Criação Manual */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Simulação</DialogTitle>
            <DialogDescription>
              Configure os parâmetros básicos da sua simulação de importação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Simulação *</Label>
              <Input
                id="name"
                placeholder="Ex: Importação de Camisetas - Fevereiro"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Detalhes adicionais sobre a simulação"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Regime Tributário */}
            <div className="space-y-2">
              <Label htmlFor="regime">Regime Tributário</Label>
              <Select
                value={formData.regime}
                onValueChange={(value) =>
                  setFormData({ ...formData, regime: value })
                }
              >
                <SelectTrigger id="regime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples-nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro-real">Lucro Real</SelectItem>
                  <SelectItem value="lucro-presumido">Lucro Presumido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TTD SC */}
            <div className="space-y-2">
              <Label htmlFor="ttd">TTD Santa Catarina</Label>
              <Select
                value={formData.ttd}
                onValueChange={(value) =>
                  setFormData({ ...formData, ttd: value })
                }
              >
                <SelectTrigger id="ttd">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="409">TTD 409</SelectItem>
                  <SelectItem value="410">TTD 410</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Incoterm */}
            <div className="space-y-2">
              <Label htmlFor="incoterm">Incoterm</Label>
              <Select
                value={formData.incoterm}
                onValueChange={(value) =>
                  setFormData({ ...formData, incoterm: value })
                }
              >
                <SelectTrigger id="incoterm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB (Free on Board)</SelectItem>
                  <SelectItem value="CIF">CIF (Cost, Insurance and Freight)</SelectItem>
                  <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                  <SelectItem value="FCA">FCA (Free Carrier)</SelectItem>
                  <SelectItem value="CPT">CPT (Carriage Paid To)</SelectItem>
                  <SelectItem value="CIP">CIP (Carriage and Insurance Paid)</SelectItem>
                  <SelectItem value="DDP">DDP (Delivered Duty Paid)</SelectItem>
                  <SelectItem value="DAP">DAP (Delivered at Place)</SelectItem>
                  <SelectItem value="DPU">DPU (Delivered at Place Unloaded)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Câmbio */}
            <div className="space-y-2">
              <Label htmlFor="cambio">Câmbio (USD/BRL) *</Label>
              <Input
                id="cambio"
                type="number"
                step="0.01"
                min="0"
                value={formData.cambio}
                onChange={(e) =>
                  setFormData({ ...formData, cambio: e.target.value })
                }
              />
            </div>

            {/* Frete Internacional */}
            <div className="space-y-2">
              <Label htmlFor="frete">Frete Internacional (USD)</Label>
              <Input
                id="frete"
                type="number"
                step="0.01"
                min="0"
                value={formData.freteInternacionalDolar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    freteInternacionalDolar: e.target.value,
                  })
                }
              />
            </div>

            {/* Seguro Internacional */}
            <div className="space-y-2">
              <Label htmlFor="seguro">Seguro Internacional (USD)</Label>
              <Input
                id="seguro"
                type="number"
                step="0.01"
                min="0"
                value={formData.seguroInternacionalDolar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seguroInternacionalDolar: e.target.value,
                  })
                }
              />
            </div>

            {/* Método de Rateio */}
            <div className="space-y-2">
              <Label htmlFor="ratio">Método de Rateio</Label>
              <Select
                value={formData.ratioMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, ratioMethod: value })
                }
              >
                <SelectTrigger id="ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cif">CIF (Padrão)</SelectItem>
                  <SelectItem value="peso">Peso</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="valor">Valor Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Simulação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de Simulações */}
      {simulacoes && simulacoes.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8">Suas Simulações</h2>
          <div className="grid gap-4">
            {simulacoes.map((sim) => (
              <Card
                key={sim.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/simulations/${sim.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{sim.name}</CardTitle>
                      {sim.description && (
                        <CardDescription>{sim.description}</CardDescription>
                      )}
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded">
                      {sim.regime === "simples-nacional"
                        ? "Simples"
                        : sim.regime === "lucro-real"
                          ? "Lucro Real"
                          : "Lucro Presumido"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Incoterm: </span>
                      <span className="font-medium">{sim.incoterm}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TTD: </span>
                      <span className="font-medium">
                        {sim.ttd === "none" ? "Nenhum" : `TTD ${sim.ttd}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criada em: </span>
                      <span className="font-medium">
                        {new Date(sim.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
