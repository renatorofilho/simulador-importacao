import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { simulationsRouter } from "./routers/simulations";
import {
  obterSimulacoesDoUsuario,
  obterSimulacao,
  criarSimulacao,
  obterItensSimulacao,
  adicionarItemASimulacao,
  obterNCMDoCache,
  adicionarNCMAoCache,
  registrarConsultaNCM,
} from "./db";
import { buscarTratamentoTributario, validarNCM } from "./services/siscomexService";
import { calcularImpostos, calcularTotaisSimulacao, type ConfiguracaoSimulacao } from "./services/calculosService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Simulações
  simulations: simulationsRouter,


  // NCM
  ncm: router({
    /**
     * Buscar dados de NCM (com cache)
     */
    search: protectedProcedure
      .input(z.object({ ncm: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const ncm = input.ncm.trim();

        // Validar formato
        if (!validarNCM(ncm)) {
          await registrarConsultaNCM(ctx.user.id, ncm, null, "api", false, "Formato inválido");
          throw new Error("NCM deve conter exatamente 8 dígitos numéricos");
        }

        try {
          // Tentar obter do cache
          const cached = await obterNCMDoCache(ncm);
          
          if (cached) {
            await registrarConsultaNCM(ctx.user.id, ncm, cached.description, "cache", true);
            
            return {
              ncm: cached.ncm,
              description: cached.description,
              ii: parseFloat(cached.ii as any),
              ipi: parseFloat(cached.ipi as any),
              pis: parseFloat(cached.pis as any),
              cofins: parseFloat(cached.cofins as any),
              source: "cache" as const,
            };
          }

          // Buscar da API Siscomex
          const resultado = await buscarTratamentoTributario(ncm);

          if (!resultado) {
            await registrarConsultaNCM(ctx.user.id, ncm, null, "api", false, "NCM não encontrada");
            throw new Error("NCM não encontrada na base da Receita Federal");
          }

          // Adicionar ao cache
          await adicionarNCMAoCache(
            resultado.ncm,
            resultado.descricao,
            resultado.tributos.ii,
            resultado.tributos.ipi,
            resultado.tributos.pis,
            resultado.tributos.cofins,
            JSON.stringify(resultado)
          );

          await registrarConsultaNCM(ctx.user.id, ncm, resultado.descricao, "api", true);

          return {
            ncm: resultado.ncm,
            description: resultado.descricao,
            ii: resultado.tributos.ii,
            ipi: resultado.tributos.ipi,
            pis: resultado.tributos.pis,
            cofins: resultado.tributos.cofins,
            source: "api" as const,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
          await registrarConsultaNCM(ctx.user.id, ncm, null, "api", false, errorMessage);
          throw error;
        }
      }),
  }),

  // Itens de simulação
  items: router({
    /**
     * Adicionar item à simulação com cálculos
     */
    add: protectedProcedure
      .input(
        z.object({
          simulationId: z.number(),
          ncm: z.string(),
          description: z.string(),
          quantity: z.number().positive(),
          unitWeight: z.number().nonnegative(),
          unitVolume: z.number().nonnegative(),
          unitValueUsd: z.number().positive(),
          ii: z.number().nonnegative(),
          ipi: z.number().nonnegative(),
          pis: z.number().nonnegative(),
          cofins: z.number().nonnegative(),
          // Configurações da simulação
          regime: z.enum(["simples-nacional", "lucro-real", "lucro-presumido"]),
          ttd: z.enum(["none", "409", "410"]),
          incoterm: z.string(),
          cambio: z.number().positive(),
          freteInternacionalDolar: z.number().nonnegative(),
          seguroInternacionalDolar: z.number().nonnegative(),
          icmsInterno: z.number().nonnegative(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verificar se a simulação pertence ao usuário
        const simulacao = await obterSimulacao(input.simulationId);
        if (!simulacao || simulacao.userId !== ctx.user.id) {
          throw new Error("Simulação não encontrada");
        }

        // Calcular impostos
        const config: ConfiguracaoSimulacao = {
          regime: input.regime,
          ttd: input.ttd,
          incoterm: input.incoterm,
          cambio: input.cambio,
          freteInternacionalDolar: input.freteInternacionalDolar,
          seguroInternacionalDolar: input.seguroInternacionalDolar,
          ratioMethod: "cif",
          icmsInterno: input.icmsInterno,
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

        // Adicionar item ao banco de dados com conversão de tipos
        const calculatedData = {
          totalWeightKg: resultado.totalWeightKg.toString() as any,
          totalVolumeM3: resultado.totalVolumeM3.toString() as any,
          totalValueUsd: resultado.totalValueUsd.toString() as any,
          valorAduaneiro: resultado.valorAduaneiro.toString() as any,
          ii_value: resultado.ii_value.toString() as any,
          ipi_value: resultado.ipi_value.toString() as any,
          pis_value: resultado.pis_value.toString() as any,
          cofins_value: resultado.cofins_value.toString() as any,
          icms_value: resultado.icms_value.toString() as any,
          precoUnitarioCif: resultado.precoUnitarioCif.toString() as any,
          precoDesembaracado: resultado.precoDesembaracado.toString() as any,
          fatorImportacao: resultado.fatorImportacao.toString() as any,
        };
        
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
          calculatedData as any
        );

        if (!item) {
          throw new Error("Erro ao adicionar item");
        }

        return {
          id: item.id,
          ...resultado,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
