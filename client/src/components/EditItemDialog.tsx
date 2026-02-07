import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationId: number;
  item: {
    id: number;
    ncm: string;
    description: string;
    quantity: number;
    unitWeight: number;
    unitVolume: number;
    unitValueUsd: number;
  };
  onSuccess?: () => void;
}

export function EditItemDialog({
  open,
  onOpenChange,
  simulationId,
  item,
  onSuccess,
}: EditItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: item.quantity.toString(),
    unitWeight: item.unitWeight.toString(),
    unitVolume: item.unitVolume.toString(),
    unitValueUsd: item.unitValueUsd.toString(),
  });

  const updateItemMutation = trpc.simulations.updateItem.useMutation();

  // Atualizar formData quando o item mudar
  useEffect(() => {
    setFormData({
      quantity: item.quantity.toString(),
      unitWeight: item.unitWeight.toString(),
      unitVolume: item.unitVolume.toString(),
      unitValueUsd: item.unitValueUsd.toString(),
    });
  }, [item]);

  const handleSave = async () => {
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!formData.unitValueUsd || parseFloat(formData.unitValueUsd) <= 0) {
      toast.error("Valor unitário deve ser maior que 0");
      return;
    }

    if (parseFloat(formData.unitWeight) < 0) {
      toast.error("Peso não pode ser negativo");
      return;
    }

    if (parseFloat(formData.unitVolume) < 0) {
      toast.error("Volume não pode ser negativo");
      return;
    }

    setLoading(true);
    try {
      await updateItemMutation.mutateAsync({
        itemId: item.id,
        simulationId: simulationId,
        quantity: parseFloat(formData.quantity),
        unitValueUsd: parseFloat(formData.unitValueUsd),
        unitWeight: parseFloat(formData.unitWeight) || 0,
        unitVolume: parseFloat(formData.unitVolume) || 0,
      });

      toast.success("Item atualizado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao atualizar item");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Atualize os dados do item. Os impostos serão recalculados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da NCM (somente leitura) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">{item.ncm}</p>
            <p className="text-sm text-blue-700">{item.description}</p>
          </div>

          {/* Campos editáveis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitWeight">Peso Unitário (kg)</Label>
              <Input
                id="unitWeight"
                type="number"
                step="0.001"
                min="0"
                value={formData.unitWeight}
                onChange={(e) =>
                  setFormData({ ...formData, unitWeight: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitVolume">Volume Unitário (m³)</Label>
              <Input
                id="unitVolume"
                type="number"
                step="0.001"
                min="0"
                value={formData.unitVolume}
                onChange={(e) =>
                  setFormData({ ...formData, unitVolume: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitValueUsd">Valor Unitário (USD) *</Label>
              <Input
                id="unitValueUsd"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.unitValueUsd}
                onChange={(e) =>
                  setFormData({ ...formData, unitValueUsd: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Cálculos em tempo real */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Valores Calculados:
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Peso Total:</span>
                <p className="font-medium">
                  {(
                    parseFloat(formData.quantity || "0") *
                    parseFloat(formData.unitWeight || "0")
                  ).toFixed(2)}{" "}
                  kg
                </p>
              </div>
              <div>
                <span className="text-gray-600">Volume Total:</span>
                <p className="font-medium">
                  {(
                    parseFloat(formData.quantity || "0") *
                    parseFloat(formData.unitVolume || "0")
                  ).toFixed(3)}{" "}
                  m³
                </p>
              </div>
              <div>
                <span className="text-gray-600">Valor Total:</span>
                <p className="font-medium">
                  ${" "}
                  {(
                    parseFloat(formData.quantity || "0") *
                    parseFloat(formData.unitValueUsd || "0")
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
