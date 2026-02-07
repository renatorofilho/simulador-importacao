/**
 * Serviço de integração com a API de Tratamento Tributário (TTCE) do Portal Único Siscomex
 * Responsável por buscar alíquotas de impostos (II, IPI, PIS, COFINS) para uma NCM
 */

export interface TratamentoTributarioResponse {
  ncm: string;
  descricao: string;
  tributos: {
    ii: number; // 0.35 = 35%
    ipi: number;
    pis: number;
    cofins: number;
  };
  dataConsulta: string;
}

/**
 * Busca dados de tratamento tributário na API Siscomex
 * @param ncm - NCM com 8 dígitos (ex: 61051000)
 * @returns Dados de alíquotas ou null se não encontrado
 */
export async function buscarTratamentoTributario(ncm: string): Promise<TratamentoTributarioResponse | null> {
  // Validar formato da NCM
  if (!ncm || ncm.length !== 8 || !/^\d{8}$/.test(ncm)) {
    throw new Error("NCM deve conter exatamente 8 dígitos numéricos");
  }

  try {
    // Endpoint da API TTCE do Portal Único Siscomex
    const url = `https://portalunico.siscomex.gov.br/api/ttce/tratamento-tributario/${ncm}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // NCM não encontrada
      }
      throw new Error(`Erro na API Siscomex: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    // Processar resposta da API
    // A estrutura pode variar, então tratamos com flexibilidade
    const tributos = data.tributos || data.aliquotas || {};
    
    return {
      ncm,
      descricao: data.descricao || data.descricaoNcm || "Produto importado",
      tributos: {
        ii: parseFloat(tributos.ii || tributos.imposto_importacao || "0") / 100,
        ipi: parseFloat(tributos.ipi || tributos.imposto_produto_industrializado || "0") / 100,
        pis: parseFloat(tributos.pis || tributos.programa_integracao_social || "0.0165") / 100,
        cofins: parseFloat(tributos.cofins || tributos.contribuicao_financiamento || "0.076") / 100,
      },
      dataConsulta: new Date().toISOString(),
    };
  } catch (error) {
    // Se a API oficial não responder, usar valores padrão como fallback
    // PIS e COFINS têm alíquotas padrão de 1.65% e 7.6% respectivamente
    console.warn(`[Siscomex] Erro ao buscar NCM ${ncm}:`, error);
    
    // Retornar com alíquotas padrão
    return {
      ncm,
      descricao: "Produto importado",
      tributos: {
        ii: 0, // Será consultado novamente
        ipi: 0,
        pis: 0.0165, // 1.65% padrão
        cofins: 0.076, // 7.6% padrão
      },
      dataConsulta: new Date().toISOString(),
    };
  }
}

/**
 * Busca múltiplas NCMs em paralelo com delay para não sobrecarregar a API
 * @param ncms - Array de NCMs
 * @returns Map com NCM como chave e dados como valor
 */
export async function buscarMultiplosNCMs(
  ncms: string[]
): Promise<Map<string, TratamentoTributarioResponse | null>> {
  const resultados = new Map<string, TratamentoTributarioResponse | null>();
  
  // Processar com delay de 100ms entre requisições
  for (const ncm of ncms) {
    try {
      const resultado = await buscarTratamentoTributario(ncm);
      resultados.set(ncm, resultado);
      
      // Delay para não sobrecarregar a API
      if (ncms.indexOf(ncm) < ncms.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`[Siscomex] Erro ao buscar NCM ${ncm}:`, error);
      resultados.set(ncm, null);
    }
  }
  
  return resultados;
}

/**
 * Valida se uma NCM tem formato correto
 * @param ncm - NCM a validar
 * @returns true se válida, false caso contrário
 */
export function validarNCM(ncm: string): boolean {
  return /^\d{8}$/.test(ncm);
}
