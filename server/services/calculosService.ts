/**
 * Serviço de cálculos tributários para importações
 * Implementa fórmulas de cálculo de impostos (II, IPI, PIS, COFINS, ICMS)
 * com suporte para diferentes regimes tributários e TTDs de Santa Catarina
 */

export interface ConfiguracaoSimulacao {
  regime: "simples-nacional" | "lucro-real" | "lucro-presumido";
  ttd: "none" | "409" | "410";
  incoterm: string;
  cambio: number;
  freteInternacionalDolar: number;
  seguroInternacionalDolar: number;
  ratioMethod: "cif" | "peso" | "volume" | "valor";
  icmsInterno: number; // Alíquota ICMS interna (ex: 0.18 = 18%)
  modalTransporte?: "aereo" | "maritimo" | "terrestre"; // Modal de transporte
}

export interface DadosItem {
  ncm: string;
  quantity: number;
  unitWeight: number; // kg
  unitVolume: number; // m³
  unitValueUsd: number;
  ii: number; // 0.35 = 35%
  ipi: number;
  pis: number;
  cofins: number;
}

export interface ResultadoCalculo {
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueUsd: number;
  
  // Valor Aduaneiro
  valorAduaneiro: number; // Em BRL
  afrmm: number; // AFRMM em BRL
  
  // Impostos
  ii_value: number; // Em BRL
  ipi_value: number; // Em BRL
  pis_value: number; // Em BRL
  cofins_value: number; // Em BRL
  icms_value: number; // Em BRL
  
  // Preços finais
  precoUnitarioCif: number; // Preço unitário CIF em BRL
  precoDesembaracado: number; // Preço desembaraçado no Brasil em BRL
  fatorImportacao: number; // Fator de importação
}

/**
 * Calcula o Valor Aduaneiro baseado no Incoterm
 * Conforme artigo 1º da Portaria Secex nº 23/2011
 */
function calcularValorAduaneiro(
  valorUsd: number,
  cambio: number,
  incoterm: string,
  freteInternacionalDolar: number,
  seguroInternacionalDolar: number
): number {
  let valorBase = valorUsd * cambio; // Converter para BRL

  // Aplicar regras de Incoterm
  // FOB: Frete e Seguro NÃO inclusos (adicionar)
  // CIF: Frete e Seguro inclusos (não adicionar)
  // EXW, FCA, CPT, CIP, DDP, DAP, DPU: Variam conforme negociação
  
  const freteEmBrl = freteInternacionalDolar * cambio;
  const seguroEmBrl = seguroInternacionalDolar * cambio;

  switch (incoterm.toUpperCase()) {
    case "FOB":
    case "FCA":
    case "EXW":
      // Adicionar frete e seguro
      valorBase += freteEmBrl + seguroEmBrl;
      break;
    case "CIF":
      // Frete e seguro já inclusos
      break;
    case "CPT":
    case "CIP":
      // Frete incluído, seguro não
      valorBase += seguroEmBrl;
      break;
    case "DDP":
    case "DAP":
    case "DPU":
      // Já incluso tudo
      break;
  }

  return valorBase;
}

/**
 * Valida e ajusta alíquotas conforme o regime tributário
 * Garante que PIS/COFINS sejam zerados para Simples Nacional e Lucro Presumido
 */
function validarAliquotasPorRegime(
  regime: "simples-nacional" | "lucro-real" | "lucro-presumido",
  aliquotas: { ii: number; ipi: number; pis: number; cofins: number }
): { ii: number; ipi: number; pis: number; cofins: number } {
  const resultado = { ...aliquotas };

  if (regime === "simples-nacional") {
    // Simples Nacional: PIS e COFINS não são recuperáveis
    resultado.pis = 0;
    resultado.cofins = 0;
    console.log("[Cálculos] Simples Nacional: PIS e COFINS zerados");
  } else if (regime === "lucro-presumido") {
    // Lucro Presumido: PIS e COFINS não são recuperáveis
    resultado.pis = 0;
    resultado.cofins = 0;
    console.log("[Cálculos] Lucro Presumido: PIS e COFINS zerados");
  } else if (regime === "lucro-real") {
    // Lucro Real: todos os créditos são recuperáveis
    console.log("[Cálculos] Lucro Real: todos os créditos recuperáveis");
  }

  return resultado;
}

/**
 * Calcula o II (Imposto de Importação)
 */
function calcularII(valorAduaneiro: number, aliquotaII: number): number {
  return valorAduaneiro * aliquotaII;
}

/**
 * Calcula o IPI (Imposto sobre Produtos Industrializados)
 * Base de cálculo: Valor Aduaneiro + II
 */
function calcularIPI(
  valorAduaneiro: number,
  ii: number,
  aliquotaIPI: number
): number {
  const baseIPI = valorAduaneiro + ii;
  return baseIPI * aliquotaIPI;
}

/**
 * Calcula PIS (Programa de Integração Social)
 * Base de cálculo: Valor Aduaneiro + II + IPI
 * Alíquota padrão: 1,65%
 */
function calcularPIS(
  valorAduaneiro: number,
  ii: number,
  ipi: number,
  aliquotaPIS: number
): number {
  const basePIS = valorAduaneiro + ii + ipi;
  return basePIS * aliquotaPIS;
}

/**
 * Calcula COFINS (Contribuição para Financiamento da Seguridade Social)
 * Base de cálculo: Valor Aduaneiro + II + IPI
 * Alíquota padrão: 7,6%
 */
function calcularCOFINS(
  valorAduaneiro: number,
  ii: number,
  ipi: number,
  aliquotaCOFINS: number
): number {
  const baseCOFINS = valorAduaneiro + ii + ipi;
  return baseCOFINS * aliquotaCOFINS;
}

/**
 * Calcula ICMS (Imposto sobre Circulação de Mercadorias e Serviços)
 * Base de cálculo: Valor Aduaneiro + II + IPI + PIS + COFINS (por dentro)
 * Fórmula: ICMS = (VA + II + IPI + PIS + COFINS) / (1 - ICMS%)
 */
function calcularICMS(
  valorAduaneiro: number,
  ii: number,
  ipi: number,
  pis: number,
  cofins: number,
  aliquotaICMS: number
): number {
  const baseComTributos = valorAduaneiro + ii + ipi + pis + cofins;
  
  // Cálculo "por dentro" do ICMS
  // ICMS = Base / (1 - alíquota)
  if (aliquotaICMS >= 1) {
    return 0; // Evitar divisão por zero
  }
  
  return baseComTributos / (1 - aliquotaICMS) - baseComTributos;
}

/**
 * Aplica benefícios do TTD 409 (Santa Catarina)
 * Diferimento do ICMS na entrada + crédito presumido na saída
 */
function aplicarBeneficioTTD409(
  icms: number,
  regime: string
): { icmsEntrada: number; creditoPresumido: number } {
  // TTD 409: Diferimento do ICMS na entrada
  // O ICMS é diferido para a saída, reduzindo o custo imediato
  
  if (regime === "simples-nacional") {
    // Simples Nacional não aproveita crédito de ICMS
    return { icmsEntrada: icms, creditoPresumido: 0 };
  }

  // Lucro Real e Lucro Presumido: Diferimento total
  return { icmsEntrada: 0, creditoPresumido: icms };
}

/**
 * Aplica benefícios do TTD 410 (Santa Catarina)
 * Redução de 75% do ICMS + crédito presumido
 */
function aplicarBeneficioTTD410(
  icms: number,
  regime: string
): { icmsEntrada: number; creditoPresumido: number } {
  // TTD 410: Redução de 75% do ICMS
  
  if (regime === "simples-nacional") {
    // Simples Nacional: Redução de 75% do ICMS
    return { icmsEntrada: icms * 0.25, creditoPresumido: 0 };
  }

  // Lucro Real e Lucro Presumido: Redução de 75% + crédito do restante
  return { icmsEntrada: icms * 0.25, creditoPresumido: icms * 0.75 };
}

/**
 * Calcula o preço unitário CIF em BRL
 */
function calcularPrecoUnitarioCIF(
  valorAduaneiro: number,
  quantity: number
): number {
  return quantity > 0 ? valorAduaneiro / quantity : 0;
}

/**
 * Calcula o preço desembaraçado no Brasil
 * = Valor Aduaneiro + II + IPI + PIS + COFINS + ICMS
 */
function calcularPrecoDesembaracado(
  valorAduaneiro: number,
  ii: number,
  ipi: number,
  pis: number,
  cofins: number,
  icms: number
): number {
  return valorAduaneiro + ii + ipi + pis + cofins + icms;
}

/**
 * Calcula o fator de importação
 * = Preço desembaraçado / Valor original em USD
 */
function calcularFatorImportacao(
  precoDesembaracado: number,
  valorUsdOriginal: number,
  cambio: number
): number {
  const valorEmBrl = valorUsdOriginal * cambio;
  return valorEmBrl > 0 ? precoDesembaracado / valorEmBrl : 0;
}

/**
 * Função principal de cálculo
 */
/**
 * Exporta a função de validação para testes
 */
export { validarAliquotasPorRegime };

export function calcularImpostos(
  item: DadosItem,
  config: ConfiguracaoSimulacao
): ResultadoCalculo {
  // 1. Calcular totais do item
  const totalWeightKg = item.quantity * item.unitWeight;
  const totalVolumeM3 = item.quantity * item.unitVolume;
  const totalValueUsd = item.quantity * item.unitValueUsd;

  // 2. Calcular Valor Aduaneiro
  const valorAduaneiro = calcularValorAduaneiro(
    totalValueUsd,
    config.cambio,
    config.incoterm,
    config.freteInternacionalDolar,
    config.seguroInternacionalDolar
  );

  // 2.5. Validar alíquotas conforme regime tributário
  const aliquotasValidadas = validarAliquotasPorRegime(config.regime, {
    ii: item.ii,
    ipi: item.ipi,
    pis: item.pis,
    cofins: item.cofins,
  });

  // 3. Calcular impostos com alíquotas validadas
  const ii = calcularII(valorAduaneiro, aliquotasValidadas.ii);
  const ipi = calcularIPI(valorAduaneiro, ii, aliquotasValidadas.ipi);
  const pis = calcularPIS(valorAduaneiro, ii, ipi, aliquotasValidadas.pis);
  const cofins = calcularCOFINS(valorAduaneiro, ii, ipi, aliquotasValidadas.cofins);
  let icms = calcularICMS(valorAduaneiro, ii, ipi, pis, cofins, config.icmsInterno);

  // 4. Aplicar benefícios de TTD
  let icmsEntrada = icms;
  let creditoPresumido = 0;

  if (config.ttd === "409") {
    const beneficio = aplicarBeneficioTTD409(icms, config.regime);
    icmsEntrada = beneficio.icmsEntrada;
    creditoPresumido = beneficio.creditoPresumido;
  } else if (config.ttd === "410") {
    const beneficio = aplicarBeneficioTTD410(icms, config.regime);
    icmsEntrada = beneficio.icmsEntrada;
    creditoPresumido = beneficio.creditoPresumido;
  }

  // 5. Calcular AFRMM (Adicional ao Frete para Marinha Mercante)
  // AFRMM = 25% do frete internacional (apenas para modal marítimo)
  let afrmm = 0;
  if (config.modalTransporte === "maritimo") {
    afrmm = config.freteInternacionalDolar * 0.25 * config.cambio;
  }

  // 6. Calcular preços finais
  const precoUnitarioCif = calcularPrecoUnitarioCIF(valorAduaneiro, item.quantity);
  const precoDesembaracado = calcularPrecoDesembaracado(
    valorAduaneiro,
    ii,
    ipi,
    pis,
    cofins,
    icmsEntrada
  );
  const fatorImportacao = calcularFatorImportacao(
    precoDesembaracado,
    totalValueUsd,
    config.cambio
  );

  return {
    totalWeightKg,
    totalVolumeM3,
    totalValueUsd,
    valorAduaneiro,
    afrmm,
    ii_value: ii,
    ipi_value: ipi,
    pis_value: pis,
    cofins_value: cofins,
    icms_value: icmsEntrada,
    precoUnitarioCif,
    precoDesembaracado,
    fatorImportacao,
  };
}

/**
 * Calcula totais de uma simulação com múltiplos itens
 */
export function calcularTotaisSimulacao(
  resultados: ResultadoCalculo[]
): {
  totalValueUsd: number;
  totalValorAduaneiro: number;
  totalII: number;
  totalIPI: number;
  totalPIS: number;
  totalCOFINS: number;
  totalICMS: number;
  totalImpostos: number;
  precoMedioDesembaracado: number;
} {
  const totais = resultados.reduce(
    (acc, r) => ({
      totalValueUsd: acc.totalValueUsd + r.totalValueUsd,
      totalValorAduaneiro: acc.totalValorAduaneiro + r.valorAduaneiro,
      totalII: acc.totalII + r.ii_value,
      totalIPI: acc.totalIPI + r.ipi_value,
      totalPIS: acc.totalPIS + r.pis_value,
      totalCOFINS: acc.totalCOFINS + r.cofins_value,
      totalICMS: acc.totalICMS + r.icms_value,
    }),
    {
      totalValueUsd: 0,
      totalValorAduaneiro: 0,
      totalII: 0,
      totalIPI: 0,
      totalPIS: 0,
      totalCOFINS: 0,
      totalICMS: 0,
    }
  );

  const totalImpostos =
    totais.totalII +
    totais.totalIPI +
    totais.totalPIS +
    totais.totalCOFINS +
    totais.totalICMS;

  const precoMedioDesembaracado =
    totais.totalValorAduaneiro + totalImpostos;

  return {
    ...totais,
    totalImpostos,
    precoMedioDesembaracado,
  };
}
