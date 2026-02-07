import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  obterSimulacoesDoUsuario,
  obterSimulacao,
  criarSimulacao,
  obterItensSimulacao,
  adicionarItemASimulacao,
  deletarSimulacao,
  atualizarItem,
  deletarItem,
} from "../db";
import { calcularImpostos, type ConfiguracaoSimulacao } from "../services/calculosService";
import { extrairProformaInvoice } from "../services/proformaService";

export const simulationsRouter = router({
  /**
   * Listar todas as simulacoes do usuario
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const simulacoes = await obterSimulacoesDoUsuario(ctx.user.id);
    return simulacoes.map((sim) => ({
      id: sim.id,
      name: sim.name,
      description: sim.description,
      regime: sim.regime,
      ttd: sim.ttd,
      incoterm: sim.incoterm,
      createdAt: sim.createdAt,
      updatedAt: sim.updatedAt,
    }));
  }),

  /**
   * Obter simulacao com todos os itens
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.id);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      const itens = await obterItensSimulacao(input.id);

      return {
        id: simulacao.id,
        name: simulacao.name,
        description: simulacao.description,
        regime: simulacao.regime,
        ttd: simulacao.ttd,
        incoterm: simulacao.incoterm,
        cambio: parseFloat(simulacao.cambio as any),
        freteInternacionalDolar: parseFloat(simulacao.freteInternacionalDolar as any),
        seguroInternacionalDolar: parseFloat(simulacao.seguroInternacionalDolar as any),
        ratioMethod: simulacao.ratioMethod,
        taxRatesJson: simulacao.taxRatesJson,
        itens: itens.map((item) => ({
          id: item.id,
          ncm: item.ncm,
          description: item.description,
          quantity: parseFloat(item.quantity as any),
          unitWeight: parseFloat(item.unitWeight as any),
          unitVolume: parseFloat(item.unitVolume as any),
          unitValueUsd: parseFloat(item.unitValueUsd as any),
          ii: parseFloat(item.ii as any),
          ipi: parseFloat(item.ipi as any),
          pis: parseFloat(item.pis as any),
          cofins: parseFloat(item.cofins as any),
          totalWeightKg: parseFloat(item.totalWeightKg as any),
          totalVolumeM3: parseFloat(item.totalVolumeM3 as any),
          totalValueUsd: parseFloat(item.totalValueUsd as any),
          valorAduaneiro: parseFloat(item.valorAduaneiro as any),
          ii_value: parseFloat(item.ii_value as any),
          ipi_value: parseFloat(item.ipi_value as any),
          pis_value: parseFloat(item.pis_value as any),
          cofins_value: parseFloat(item.cofins_value as any),
          icms_value: parseFloat(item.icms_value as any),
          precoUnitarioCif: parseFloat(item.precoUnitarioCif as any),
          precoDesembaracado: parseFloat(item.precoDesembaracado as any),
          fatorImportacao: parseFloat(item.fatorImportacao as any),
        })),
        createdAt: simulacao.createdAt,
        updatedAt: simulacao.updatedAt,
      };
    }),

  /**
   * Criar nova simulacao
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        regime: z.enum(["simples-nacional", "lucro-real", "lucro-presumido"]),
        ttd: z.enum(["none", "409", "410"]),
        incoterm: z.string().default("FOB"),
        cambio: z.number().positive(),
        freteInternacionalDolar: z.number().default(0),
        seguroInternacionalDolar: z.number().default(0),
        ratioMethod: z.enum(["cif", "peso", "volume", "valor"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await criarSimulacao(
        ctx.user.id,
        input.name,
        input.description || null,
        input.regime,
        input.ttd,
        input.incoterm,
        input.cambio,
        input.freteInternacionalDolar,
        input.seguroInternacionalDolar,
        input.ratioMethod
      );

      if (!simulacao) {
        throw new Error("Erro ao criar simulacao");
      }

      return {
        id: simulacao.id,
        name: simulacao.name,
        message: "Simulacao criada com sucesso",
      };
    }),

  /**
   * Atualizar simulacao
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        regime: z.enum(["simples-nacional", "lucro-real", "lucro-presumido"]),
        ttd: z.enum(["none", "409", "410"]),
        incoterm: z.string().default("FOB"),
        cambio: z.number().positive(),
        freteInternacionalDolar: z.number().default(0),
        seguroInternacionalDolar: z.number().default(0),
        ratioMethod: z.enum(["cif", "peso", "volume", "valor"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.id);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      // TODO: Implementar atualizacao no db.ts
      throw new Error("Funcionalidade em desenvolvimento");
    }),

  /**
   * Deletar simulacao
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.id);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      const success = await deletarSimulacao(input.id);

      if (!success) {
        throw new Error("Erro ao deletar simulacao");
      }

      return {
        success: true,
        message: "Simulacao deletada com sucesso",
      };
    }),

  /**
   * Importar Proforma Invoice
   */
  importProforma: protectedProcedure
    .input(
      z.object({
        simulationId: z.number(),
        fileContent: z.string(),
        fileType: z.enum(["pdf", "xlsx", "xls", "csv", "txt"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.simulationId);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      try {
        const buffer = Buffer.from(input.fileContent, "base64");
        const proformaData = await extrairProformaInvoice(buffer, input.fileType);

        const config: ConfiguracaoSimulacao = {
          regime: simulacao.regime as any,
          ttd: simulacao.ttd as any,
          incoterm: simulacao.incoterm,
          cambio: parseFloat(simulacao.cambio as any),
          freteInternacionalDolar: parseFloat(simulacao.freteInternacionalDolar as any),
          seguroInternacionalDolar: parseFloat(simulacao.seguroInternacionalDolar as any),
          ratioMethod: simulacao.ratioMethod as any,
          icmsInterno: 0.18,
        };

        const itensAdicionados = [];

        for (const item of proformaData.items) {
          const resultado = calcularImpostos(
            {
              ncm: item.sku,
              quantity: item.quantity,
              unitWeight: item.unitWeight,
              unitVolume: item.unitVolume,
              unitValueUsd: item.unitValueUsd,
              ii: 0.35,
              ipi: 0,
              pis: 0.0165,
              cofins: 0.076,
            },
            config
          );

          const itemAdicionado = await adicionarItemASimulacao(
            input.simulationId,
            item.sku,
            item.description,
            item.quantity,
            item.unitWeight,
            item.unitVolume,
            item.unitValueUsd,
            0.35,
            0,
            0.0165,
            0.076,
            {
              totalWeightKg: resultado.totalWeightKg.toString(),
              totalVolumeM3: resultado.totalVolumeM3.toString(),
              totalValueUsd: resultado.totalValueUsd.toString(),
              valorAduaneiro: resultado.valorAduaneiro.toString(),
              ii_value: resultado.ii_value.toString(),
              ipi_value: resultado.ipi_value.toString(),
              pis_value: resultado.pis_value.toString(),
              cofins_value: resultado.cofins_value.toString(),
              icms_value: resultado.icms_value.toString(),
              precoUnitarioCif: resultado.precoUnitarioCif.toString(),
              precoDesembaracado: resultado.precoDesembaracado.toString(),
              fatorImportacao: resultado.fatorImportacao.toString(),
            }
          );

          if (itemAdicionado) {
            itensAdicionados.push(itemAdicionado);
          }
        }

        return {
          success: true,
          itemsImported: itensAdicionados.length,
          totalValue: proformaData.totalValueUsd,
          message: `${itensAdicionados.length} itens importados com sucesso`,
        };
      } catch (error) {
        console.error("[Simulacoes] Erro ao importar proforma:", error);
        throw new Error(
          error instanceof Error ? error.message : "Erro ao importar arquivo"
        );
      }
    }),

  /**
   * Adicionar item a simulacao
   */
  addItem: protectedProcedure
    .input(
      z.object({
        simulationId: z.number(),
        ncm: z.string().regex(/^\d{8}$/, "NCM deve ter 8 digitos"),
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitWeight: z.number().default(0),
        unitVolume: z.number().default(0),
        unitValueUsd: z.number().positive(),
        ii: z.number().default(0.35),
        ipi: z.number().default(0),
        pis: z.number().default(0.0165),
        cofins: z.number().default(0.076),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.simulationId);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      const config: ConfiguracaoSimulacao = {
        regime: simulacao.regime as any,
        ttd: simulacao.ttd as any,
        incoterm: simulacao.incoterm,
        cambio: parseFloat(simulacao.cambio as any),
        freteInternacionalDolar: parseFloat(simulacao.freteInternacionalDolar as any),
        seguroInternacionalDolar: parseFloat(simulacao.seguroInternacionalDolar as any),
        ratioMethod: simulacao.ratioMethod as any,
        icmsInterno: 0.18,
      };

      const resultado = calcularImpostos(
        {
          ncm: input.ncm,
          quantity: input.quantity,
          unitWeight: input.unitWeight,
          unitVolume: input.unitVolume,
          unitValueUsd: input.unitValueUsd,
          ii: input.ii,
          ipi: input.ipi,
          pis: input.pis,
          cofins: input.cofins,
        },
        config
      );

      const item = await adicionarItemASimulacao(
        input.simulationId,
        input.ncm,
        input.description,
        input.quantity,
        input.unitWeight,
        input.unitVolume,
        input.unitValueUsd,
        input.ii,
        input.ipi,
        input.pis,
        input.cofins,
        {
          totalWeightKg: resultado.totalWeightKg.toString(),
          totalVolumeM3: resultado.totalVolumeM3.toString(),
          totalValueUsd: resultado.totalValueUsd.toString(),
          valorAduaneiro: resultado.valorAduaneiro.toString(),
          ii_value: resultado.ii_value.toString(),
          ipi_value: resultado.ipi_value.toString(),
          pis_value: resultado.pis_value.toString(),
          cofins_value: resultado.cofins_value.toString(),
          icms_value: resultado.icms_value.toString(),
          precoUnitarioCif: resultado.precoUnitarioCif.toString(),
          precoDesembaracado: resultado.precoDesembaracado.toString(),
          fatorImportacao: resultado.fatorImportacao.toString(),
        }
      )

      if (!item) {
        throw new Error("Erro ao adicionar item");
      }

      return {
        id: item.id,
        ncm: item.ncm,
        message: "Item adicionado com sucesso",
      };
    }),

  /**
   * Atualizar item da simulacao
   */
  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        simulationId: z.number(),
        quantity: z.number().positive(),
        unitWeight: z.number().default(0),
        unitVolume: z.number().default(0),
        unitValueUsd: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.simulationId);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      const itens = await obterItensSimulacao(input.simulationId);
      const item = itens.find((i) => i.id === input.itemId);

      if (!item) {
        throw new Error("Item nao encontrado");
      }

      const config: ConfiguracaoSimulacao = {
        regime: simulacao.regime as any,
        ttd: simulacao.ttd as any,
        incoterm: simulacao.incoterm,
        cambio: parseFloat(simulacao.cambio as any),
        freteInternacionalDolar: parseFloat(simulacao.freteInternacionalDolar as any),
        seguroInternacionalDolar: parseFloat(simulacao.seguroInternacionalDolar as any),
        ratioMethod: simulacao.ratioMethod as any,
        icmsInterno: 0.18,
      };

      const resultado = calcularImpostos(
        {
          ncm: item.ncm,
          quantity: input.quantity,
          unitWeight: input.unitWeight,
          unitVolume: input.unitVolume,
          unitValueUsd: input.unitValueUsd,
          ii: parseFloat(item.ii as any),
          ipi: parseFloat(item.ipi as any),
          pis: parseFloat(item.pis as any),
          cofins: parseFloat(item.cofins as any),
        },
        config
      );

      const updated = await atualizarItem(
        input.itemId,
        input.quantity,
        input.unitWeight,
        input.unitVolume,
        input.unitValueUsd,
        resultado
      );

      if (!updated) {
        throw new Error("Erro ao atualizar item");
      }

      return {
        id: updated.id,
        ncm: updated.ncm,
        message: "Item atualizado com sucesso",
      };
    }),

  /**
   * Deletar item da simulacao
   */
  deleteItem: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        simulationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const simulacao = await obterSimulacao(input.simulationId);

      if (!simulacao || simulacao.userId !== ctx.user.id) {
        throw new Error("Simulacao nao encontrada");
      }

      const success = await deletarItem(input.itemId);

      if (!success) {
        throw new Error("Erro ao deletar item");
      }

      return {
        success: true,
        message: "Item deletado com sucesso",
      };
    }),
});
