import { describe, it, expect } from "vitest";
import { calcularImpostos, type ConfiguracaoSimulacao } from "./calculosService";

describe("Cálculos Tributários", () => {
  const configBase: ConfiguracaoSimulacao = {
    regime: "lucro-real",
    ttd: "none",
    incoterm: "FOB",
    cambio: 5.0,
    freteInternacionalDolar: 1000,
    seguroInternacionalDolar: 100,
    ratioMethod: "cif",
    icmsInterno: 0.18,
  };

  describe("Cálculo de Valor Aduaneiro", () => {
    it("FOB: deve incluir frete e seguro", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      // FOB: valor + frete + seguro
      const valorEsperado = (100 * 10 + 1000 + 100) * 5.0;
      expect(resultado.valorAduaneiro).toBeCloseTo(valorEsperado, 2);
    });

    it("CIF: não deve incluir frete e seguro (já inclusos)", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, incoterm: "CIF" }
      );

      // CIF: apenas valor
      const valorEsperado = 100 * 10 * 5.0;
      expect(resultado.valorAduaneiro).toBeCloseTo(valorEsperado, 2);
    });
  });

  describe("Cálculo de II (Imposto de Importação)", () => {
    it("Deve calcular II corretamente com alíquota de 35%", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      // II = Valor Aduaneiro * 35%
      const iiEsperado = resultado.valorAduaneiro * 0.35;
      expect(resultado.ii_value).toBeCloseTo(iiEsperado, 2);
    });

    it("Deve calcular II com alíquota de 0%", () => {
      const resultado = calcularImpostos(
        {
          ncm: "85371090",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      expect(resultado.ii_value).toBeCloseTo(0, 2);
    });
  });

  describe("Validação por Regime Tributário", () => {
    it("Simples Nacional: PIS e COFINS devem ser zerados", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, regime: "simples-nacional" }
      );

      expect(resultado.pis_value).toBeCloseTo(0, 2);
      expect(resultado.cofins_value).toBeCloseTo(0, 2);
    });

    it("Lucro Presumido: PIS e COFINS devem ser zerados", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, regime: "lucro-presumido" }
      );

      expect(resultado.pis_value).toBeCloseTo(0, 2);
      expect(resultado.cofins_value).toBeCloseTo(0, 2);
    });

    it("Lucro Real: PIS e COFINS devem ser mantidos", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, regime: "lucro-real" }
      );

      expect(resultado.pis_value).toBeGreaterThan(0);
      expect(resultado.cofins_value).toBeGreaterThan(0);
    });
  });

  describe("Cálculo de AFRMM", () => {
    it("Modal Marítimo: AFRMM = 25% do frete", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, modalTransporte: "maritimo" }
      );

      const afrmEsperado = 1000 * 0.25 * 5.0; // frete * 25% * câmbio
      expect(resultado.afrmm).toBeCloseTo(afrmEsperado, 2);
    });

    it("Modal Aéreo: AFRMM deve ser zero", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, modalTransporte: "aereo" }
      );

      expect(resultado.afrmm).toBeCloseTo(0, 2);
    });

    it("Modal Terrestre: AFRMM deve ser zero", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        { ...configBase, modalTransporte: "terrestre" }
      );

      expect(resultado.afrmm).toBeCloseTo(0, 2);
    });
  });

  describe("Cálculo de Preço Desembaraçado", () => {
    it("Deve incluir todos os impostos", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      // Preço desembaraçado = Valor Aduaneiro + II + IPI + PIS + COFINS + ICMS
      const preçoEsperado =
        resultado.valorAduaneiro +
        resultado.ii_value +
        resultado.ipi_value +
        resultado.pis_value +
        resultado.cofins_value +
        resultado.icms_value;

      expect(resultado.precoDesembaracado).toBeCloseTo(preçoEsperado, 2);
    });
  });

  describe("Cálculo de Fator de Importação", () => {
    it("Fator deve ser maior que 1 (preço final > preço original)", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      expect(resultado.fatorImportacao).toBeGreaterThan(1);
    });
  });

  describe("Casos Extremos", () => {
    it("Quantidade zero: deve retornar zero para totais", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 0,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 10,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      expect(resultado.totalWeightKg).toBe(0);
      expect(resultado.totalVolumeM3).toBe(0);
      expect(resultado.totalValueUsd).toBe(0);
    });

    it("Valor unitário zero: deve retornar zero para valor total", () => {
      const resultado = calcularImpostos(
        {
          ncm: "61051000",
          quantity: 100,
          unitWeight: 0.5,
          unitVolume: 0.01,
          unitValueUsd: 0,
          ii: 0.35,
          ipi: 0,
          pis: 0.0165,
          cofins: 0.076,
        },
        configBase
      );

      expect(resultado.totalValueUsd).toBe(0);
      expect(resultado.valorAduaneiro).toBeCloseTo(
        (1000 + 100) * 5.0, // apenas frete + seguro
        2
      );
    });
  });
});
