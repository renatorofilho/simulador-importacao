import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNCMCache } from "@/contexts/NCMCacheContext";
import { Plus, Loader2, ArrowLeft, Search, Upload, Trash2, Save, Edit, X } from "lucide-react";
import { ProformaImportDialog } from "@/components/ProformaImportDialog";
import { EditItemDialog } from "@/components/EditItemDialog";
import { CacheStatusBadge } from "@/components/CacheStatusBadge";
import { RegimeTaxBadge, TaxInfoCard } from "@/components/RegimeTaxBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SimulationDetailPageProps {
  simulationId: number;
}

export default function SimulationDetailPage({
  simulationId,
}: SimulationDetailPageProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { getCachedNCM, setCachedNCM } = useNCMCache();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [ncmSearch, setNcmSearch] = useState("");
  const [ncmData, setNcmData] = useState<any>(null);
  const [isSearchingNCM, setIsSearchingNCM] = useState(false);
  const [isProformaOpen, setIsProformaOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    quantity: "1",
    unitWeight: "0",
    unitVolume: "0",
    unitValueUsd: "0",
  });

  const { data: simulation, isLoading, refetch } =
    trpc.simulations.get.useQuery({ id: simulationId });
  const searchNCMMutation = trpc.ncm.search.useMutation();
  const addItemMutation = trpc.items.add.useMutation();
  const deleteSimulationMutation = trpc.simulations.delete.useMutation();
  const deleteItemMutation = trpc.simulations.deleteItem.useMutation();

  const handleSearchNCM = async () => {
    if (!ncmSearch.trim()) {
      toast.error("Digite uma NCM válida");
      return;
    }

    // Verificar cache primeiro
    const cached = getCachedNCM(ncmSearch.trim());
    if (cached) {
      setNcmData(cached);
      toast.success(`NCM encontrada (cache): ${cached.description}`, {
        duration: 2000,
      });
      return;
    }

    setIsSearchingNCM(true);
    try {
      const result = await searchNCMMutation.mutateAsync({
        ncm: ncmSearch.trim(),
      });
      
      // Salvar no cache
      setCachedNCM(result.ncm, {
        ncm: result.ncm,
        description: result.description,
        ii: result.ii,
        ipi: result.ipi,
        pis: result.pis,
        cofins: result.cofins,
      });
      
      setNcmData(result);
      toast.success(`NCM encontrada (API): ${result.description}`);
    } catch (error) {
      toast.error("Erro ao buscar NCM");
      console.error(error);
    } finally {
      setIsSearchingNCM(false);
    }
  };

  const handleAddItem = async () => {
    if (!ncmData) {
      toast.error("Selecione uma NCM primeiro");
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!formData.unitValueUsd || parseFloat(formData.unitValueUsd) <= 0) {
      toast.error("Valor unitário deve ser maior que 0");
      return;
    }

    if (!simulation) return;

    setIsAddingItem(true);
    try {
      await addItemMutation.mutateAsync({
        simulationId,
        ncm: ncmData.ncm,
        description: ncmData.description,
        quantity: parseFloat(formData.quantity),
        unitWeight: parseFloat(formData.unitWeight) || 0,
        unitVolume: parseFloat(formData.unitVolume) || 0,
        unitValueUsd: parseFloat(formData.unitValueUsd),
        ii: ncmData.ii || 0,
        ipi: ncmData.ipi || 0,
        pis: ncmData.pis || 0.0165,
        cofins: ncmData.cofins || 0.076,
        regime: simulation.regime as any,
        ttd: simulation.ttd as any,
        incoterm: simulation.incoterm,
        cambio: simulation.cambio,
        freteInternacionalDolar: simulation.freteInternacionalDolar,
        seguroInternacionalDolar: simulation.seguroInternacionalDolar,
        icmsInterno: 0.18,
      });

      toast.success("Item adicionado com sucesso!");
      setNcmSearch("");
      setNcmData(null);
      setFormData({
        quantity: "1",
        unitWeight: "0",
        unitVolume: "0",
        unitValueUsd: "0",
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao adicionar item");
      console.error(error);
    } finally {
      setIsAddingItem(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Simulação não encontrada</p>
        <Button onClick={() => navigate("/simulations")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const totalValueUsd = simulation.itens.reduce(
    (sum, item) => sum + item.totalValueUsd,
    0
  );
  const totalII = simulation.itens.reduce((sum, item) => sum + item.ii_value, 0);
  const totalIPI = simulation.itens.reduce(
    (sum, item) => sum + item.ipi_value,
    0
  );
  const totalPIS = simulation.itens.reduce(
    (sum, item) => sum + item.pis_value,
    0
  );
  const totalCOFINS = simulation.itens.reduce(
    (sum, item) => sum + item.cofins_value,
    0
  );
  const totalICMS = simulation.itens.reduce(
    (sum, item) => sum + item.icms_value,
    0
  );
  const totalImpostos = totalII + totalIPI + totalPIS + totalCOFINS + totalICMS;
  const totalDesembaracado = totalValueUsd + totalImpostos;

  return (
    <div className="space-y-6">
      {/* Header com botões */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/simulations")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{simulation.name}</h1>
          {simulation.description && (
            <p className="text-muted-foreground">{simulation.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <CacheStatusBadge />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsProformaOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Importar Proforma
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            disabled={isDeleting}
            onClick={async () => {
              if (confirm("Tem certeza que deseja deletar esta simulacao?")) {
                setIsDeleting(true);
                try {
                  await deleteSimulationMutation.mutateAsync({ id: simulationId });
                  toast.success("Simulacao deletada com sucesso");
                  navigate("/simulations");
                } catch (error) {
                  toast.error("Erro ao deletar simulacao");
                } finally {
                  setIsDeleting(false);
                }
              }
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Deletar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Proforma Import Dialog */}
      <ProformaImportDialog
        open={isProformaOpen}
        onOpenChange={setIsProformaOpen}
        simulationId={simulationId}
        onImportSuccess={() => refetch()}
      />

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Regime</p>
              <p className="font-medium">
                {simulation.regime === "simples-nacional"
                  ? "Simples Nacional"
                  : simulation.regime === "lucro-real"
                    ? "Lucro Real"
                    : "Lucro Presumido"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TTD</p>
              <p className="font-medium">
                {simulation.ttd === "none" ? "Nenhum" : `TTD ${simulation.ttd}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incoterm</p>
              <p className="font-medium">{simulation.incoterm}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Câmbio</p>
              <p className="font-medium">
                R$ {simulation.cambio.toFixed(2)}/USD
              </p>
            </div>
          </div>
          
          {/* Avisos de validação */}
          <TaxInfoCard 
            regime={simulation.regime as any} 
            ttd={simulation.ttd as any}
          />
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Itens de Importação</CardTitle>
            <CardDescription>
              {simulation.itens.length} item(ns) adicionado(s)
            </CardDescription>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Item</DialogTitle>
                <DialogDescription>
                  Busque a NCM e configure os dados do item
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Busca de NCM */}
                <div className="space-y-2">
                  <Label htmlFor="ncm">NCM (8 dígitos) *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ncm"
                      placeholder="Ex: 61051000"
                      value={ncmSearch}
                      onChange={(e) => setNcmSearch(e.target.value)}
                      maxLength={8}
                    />
                    <Button
                      onClick={handleSearchNCM}
                      disabled={isSearchingNCM || !ncmSearch.trim()}
                    >
                      {isSearchingNCM ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Dados da NCM */}
                {ncmData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-900">{ncmData.ncm}</p>
                    <p className="text-sm text-blue-700">{ncmData.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-blue-600">II:</span> {(ncmData.ii * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-blue-600">IPI:</span> {(ncmData.ipi * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados do Item */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitWeight">Peso Unitário (kg)</Label>
                    <Input
                      id="unitWeight"
                      type="number"
                      placeholder="0"
                      value={formData.unitWeight}
                      onChange={(e) =>
                        setFormData({ ...formData, unitWeight: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitVolume">Volume Unitário (m³)</Label>
                    <Input
                      id="unitVolume"
                      type="number"
                      placeholder="0"
                      value={formData.unitVolume}
                      onChange={(e) =>
                        setFormData({ ...formData, unitVolume: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitValueUsd">Valor Unitário (USD) *</Label>
                    <Input
                      id="unitValueUsd"
                      type="number"
                      placeholder="0.00"
                      value={formData.unitValueUsd}
                      onChange={(e) =>
                        setFormData({ ...formData, unitValueUsd: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <DialogTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogTrigger>
                <Button
                  onClick={handleAddItem}
                  disabled={isAddingItem || !ncmData}
                >
                  {isAddingItem ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 w-4 h-4" />
                      Adicionar Item
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {simulation.itens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum item adicionado. Clique em "Adicionar Item" para começar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCM</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor Unit (USD)</TableHead>
                    <TableHead className="text-right">Total (USD)</TableHead>
                    <TableHead className="text-right">Impostos (R$)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulation.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.ncm}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${item.unitValueUsd.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.totalValueUsd.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(item.ii_value + item.ipi_value + item.pis_value + item.cofins_value + item.icms_value).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingItemId(item.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {simulation.itens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total (USD)</p>
                <p className="text-2xl font-bold">${totalValueUsd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impostos (R$)</p>
                <p className="text-2xl font-bold">R$ {totalImpostos.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desembaraçado (R$)</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalDesembaracado.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
        <EditItemDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          simulationId={simulationId}
          item={editingItem}
          onSuccess={() => {
            refetch();
            setEditingItem(null);
          }}
        />
      )}

      {/* Delete Item Alert Dialog */}
      <AlertDialog
        open={deletingItemId !== null}
        onOpenChange={(open) => !open && setDeletingItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingItemId) {
                  try {
                    await deleteItemMutation.mutateAsync({
                      itemId: deletingItemId,
                      simulationId: simulationId,
                    });
                    toast.success("Item excluído com sucesso!");
                    refetch();
                  } catch (error) {
                    toast.error("Erro ao excluir item");
                    console.error(error);
                  } finally {
                    setDeletingItemId(null);
                  }
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
