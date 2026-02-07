import { eq, and, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  simulations,
  simulationItems,
  ncmCache,
  ncmQueryHistory,
  type Simulation,
  type SimulationItem,
  type NCMCache,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Buscar NCM no cache
 */
export async function obterNCMDoCache(ncm: string): Promise<NCMCache | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(ncmCache)
      .where(
        and(
          eq(ncmCache.ncm, ncm),
          lte(ncmCache.expiresAt, new Date()) // Ainda válido
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Erro ao buscar NCM em cache:", error);
    return null;
  }
}

/**
 * Adicionar NCM ao cache
 */
export async function adicionarNCMAoCache(
  ncm: string,
  description: string,
  ii: number,
  ipi: number,
  pis: number,
  cofins: number,
  rawData?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await db
      .insert(ncmCache)
      .values({
        ncm,
        description,
        ii: ii.toString() as any,
        ipi: ipi.toString() as any,
        pis: pis.toString() as any,
        cofins: cofins.toString() as any,
        rawDataJson: rawData,
        expiresAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          description,
          ii: ii.toString() as any,
          ipi: ipi.toString() as any,
          pis: pis.toString() as any,
          cofins: cofins.toString() as any,
          rawDataJson: rawData,
          expiresAt,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Erro ao adicionar NCM ao cache:", error);
  }
}

/**
 * Registrar consulta de NCM no histórico
 */
export async function registrarConsultaNCM(
  userId: number,
  ncm: string,
  description: string | null,
  source: "api" | "cache",
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(ncmQueryHistory).values({
      userId,
      ncm,
      description,
      source,
      success,
      errorMessage,
    });
  } catch (error) {
    console.error("[Database] Erro ao registrar consulta NCM:", error);
  }
}

/**
 * Criar simulação
 */
export async function criarSimulacao(
  userId: number,
  name: string,
  description: string | null,
  regime: string,
  ttd: string,
  incoterm: string,
  cambio: number,
  freteInternacionalDolar: number,
  seguroInternacionalDolar: number,
  ratioMethod: string,
  taxRatesJson?: string
): Promise<Simulation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    console.log("[Database] Criando simulação:", { userId, name, regime, ttd });
    
    const result = await db.insert(simulations).values({
      userId,
      name,
      description,
      regime: regime as any,
      ttd: ttd as any,
      incoterm,
      cambio: cambio.toString() as any,
      freteInternacionalDolar: freteInternacionalDolar.toString() as any,
      seguroInternacionalDolar: seguroInternacionalDolar.toString() as any,
      ratioMethod: ratioMethod as any,
      taxRatesJson,
    });

    // Retornar a simulação criada
    const id = (result as any).insertId;
    console.log("[Database] Simulação criada com ID:", id);
    
    const simulacoes = await db
      .select()
      .from(simulations)
      .where(eq(simulations.id, id))
      .limit(1);

    if (simulacoes.length === 0) {
      console.error("[Database] Simulação não encontrada após inserção");
      return null;
    }
    
    console.log("[Database] Simulação retornada:", simulacoes[0]);
    return simulacoes[0];
  } catch (error) {
    console.error("[Database] Erro ao criar simulação:", error);
    if (error instanceof Error) {
      console.error("[Database] Mensagem de erro:", error.message);
      console.error("[Database] Stack:", error.stack);
    }
    return null;
  }
}

/**
 * Obter simulações do usuário
 */
export async function obterSimulacoesDoUsuario(userId: number): Promise<Simulation[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(simulations)
      .where(eq(simulations.userId, userId));
  } catch (error) {
    console.error("[Database] Erro ao obter simulações:", error);
    return [];
  }
}

/**
 * Obter simulação por ID
 */
export async function obterSimulacao(id: number): Promise<Simulation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(simulations)
      .where(eq(simulations.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Erro ao obter simulação:", error);
    return null;
  }
}

/**
 * Adicionar item à simulação
 */
export async function adicionarItemASimulacao(
  simulationId: number,
  ncm: string,
  description: string,
  quantity: number,
  unitWeight: number,
  unitVolume: number,
  unitValueUsd: number,
  ii: number,
  ipi: number,
  pis: number,
  cofins: number,
  calculatedData: Partial<SimulationItem>
): Promise<SimulationItem | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(simulationItems).values({
      simulationId,
      ncm,
      description,
      quantity: quantity.toString() as any,
      unitWeight: unitWeight.toString() as any,
      unitVolume: unitVolume.toString() as any,
      unitValueUsd: unitValueUsd.toString() as any,
      ii: ii.toString() as any,
      ipi: ipi.toString() as any,
      pis: pis.toString() as any,
      cofins: cofins.toString() as any,
      ...calculatedData,
    });

    const id = (result as any).insertId;
    const items = await db
      .select()
      .from(simulationItems)
      .where(eq(simulationItems.id, id))
      .limit(1);

    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error("[Database] Erro ao adicionar item:", error);
    return null;
  }
}

/**
 * Obter itens da simulação
 */
export async function obterItensSimulacao(simulationId: number): Promise<SimulationItem[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(simulationItems)
      .where(eq(simulationItems.simulationId, simulationId));
  } catch (error) {
    console.error("[Database] Erro ao obter itens:", error);
    return [];
  }
}

/**
 * Deletar simulacao e seus itens
 */
export async function deletarSimulacao(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Primeiro deletar todos os itens da simulacao
    await db.delete(simulationItems).where(eq(simulationItems.simulationId, id));
    
    // Depois deletar a simulacao
    await db.delete(simulations).where(eq(simulations.id, id));
    
    console.log("[Database] Simulacao deletada com sucesso:", id);
    return true;
  } catch (error) {
    console.error("[Database] Erro ao deletar simulacao:", error);
    return false;
  }
}


/**
 * Atualizar item da simulacao
 */
export async function atualizarItem(
  itemId: number,
  quantity: number,
  unitWeight: number,
  unitVolume: number,
  unitValueUsd: number,
  resultado: any
): Promise<SimulationItem | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Database not available");
    return null;
  }

  try {
    const totalWeightKg = quantity * unitWeight;
    const totalVolumeM3 = quantity * unitVolume;
    const totalValueUsd = quantity * unitValueUsd;

    await db
      .update(simulationItems)
      .set({
        quantity: quantity.toString(),
        unitWeight: unitWeight.toString(),
        unitVolume: unitVolume.toString(),
        unitValueUsd: unitValueUsd.toString(),
        totalWeightKg: totalWeightKg.toString(),
        totalVolumeM3: totalVolumeM3.toString(),
        totalValueUsd: totalValueUsd.toString(),
        valorAduaneiro: resultado.valorAduaneiro.toString(),
        ii_value: resultado.ii_value.toString(),
        ipi_value: resultado.ipi_value.toString(),
        pis_value: resultado.pis_value.toString(),
        cofins_value: resultado.cofins_value.toString(),
        icms_value: resultado.icms_value.toString(),
        precoUnitarioCif: resultado.precoUnitarioCif.toString(),
        precoDesembaracado: resultado.precoDesembaracado.toString(),
        fatorImportacao: resultado.fatorImportacao.toString(),
        updatedAt: new Date(),
      })
      .where(eq(simulationItems.id, itemId));

    console.log("[Database] Item atualizado com sucesso:", itemId);
    
    const updated = await db
      .select()
      .from(simulationItems)
      .where(eq(simulationItems.id, itemId))
      .limit(1);

    return updated.length > 0 ? updated[0] : null;
  } catch (error) {
    console.error("[Database] Erro ao atualizar item:", error);
    return null;
  }
}

/**
 * Deletar item da simulacao
 */
export async function deletarItem(itemId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Database not available");
    return false;
  }

  try {
    await db.delete(simulationItems).where(eq(simulationItems.id, itemId));
    console.log("[Database] Item deletado com sucesso:", itemId);
    return true;
  } catch (error) {
    console.error("[Database] Erro ao deletar item:", error);
    return false;
  }
}
