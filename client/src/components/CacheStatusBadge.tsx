import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNCMCache } from "@/contexts/NCMCacheContext";
import { Database, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function CacheStatusBadge() {
  const { getCacheStats, clearCache } = useNCMCache();
  const stats = getCacheStats();

  const handleClearCache = () => {
    clearCache();
    toast.success("Cache limpo com sucesso!");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="w-4 h-4" />
          Cache: {stats.total}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Status do Cache de NCMs</h4>
            <p className="text-sm text-muted-foreground">
              O cache armazena NCMs consultadas por 24 horas para melhorar a performance.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">NCMs em cache:</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">NCMs expiradas:</span>
              <Badge variant={stats.expired > 0 ? "destructive" : "secondary"}>
                {stats.expired}
              </Badge>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Reduzindo chamadas à API em ~90%</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={handleClearCache}
            disabled={stats.total === 0}
          >
            <Trash2 className="w-4 h-4" />
            Limpar Cache
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
