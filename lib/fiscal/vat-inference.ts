/**
 * Inferência de IVA a partir de (base, IVA) quando o CSV ou o OCR não
 * trazem a taxa explícita.
 *
 * Cobertura:
 *   Continente : 0, 6, 13, 23
 *   Madeira    : 0, 5, 12, 22
 *   Açores     : 0, 4, 9, 16
 *
 * Estratégia:
 *   1. Calcula taxa efectiva r = vat / base.
 *   2. Se r ≈ uma taxa única (tolerância 0.5 p.p.), devolve uma linha
 *      com essa taxa.
 *   3. Caso contrário, tenta decomposição em 2 taxas. Para cada par
 *      (r1, r2) válido para a região, resolve:
 *          r1·x + r2·(B − x) = V       com 0 ≤ x ≤ B
 *      Se a solução satisfaz a equação dentro da tolerância e ambos os
 *      ramos têm pelo menos 1 cêntimo de base, devolve um vatBreakdown
 *      de 2 linhas. Útil para faturas de restaurante (comida 13/23 +
 *      bebidas 23, ou similar) e prestações mistas serviço+materiais.
 *   4. Se nada bate, devolve a melhor aproximação a uma única taxa
 *      (pode ser uma taxa não standard — sinaliza-se em `confidence`).
 *
 * Os valores são todos em cêntimos para evitar erros de arredondamento.
 */

export type VatRegion = "mainland" | "madeira" | "azores"

export type VatLine = { rate: number; base: number; vat: number }

export type VatInference = {
  /** Conjunto de linhas que somadas reproduzem (baseCents, vatCents). */
  breakdown: VatLine[]
  /** "exact" = taxa única bate dentro da tolerância. "mixed" = duas taxas. "approx" = só conseguiu best-effort. */
  confidence: "exact" | "mixed" | "approx"
  /** Para o caso de uma taxa única, a taxa identificada. Em "mixed" devolve a média ponderada. */
  effectiveRate: number
}

const RATES: Record<VatRegion, number[]> = {
  mainland: [0, 6, 13, 23],
  madeira: [0, 5, 12, 22],
  azores: [0, 4, 9, 16],
}

const SINGLE_RATE_TOLERANCE = 0.5 // pontos percentuais
const MIN_LEG_CENTS = 1 // 0,01 €

export function inferVatBreakdown(
  baseCents: number,
  vatCents: number,
  region: VatRegion = "mainland"
): VatInference {
  if (baseCents <= 0) {
    return { breakdown: [], confidence: "exact", effectiveRate: 0 }
  }

  const rates = RATES[region]
  const effective = (vatCents * 100) / baseCents

  // 1. Taxa única.
  let bestSingle = rates[0]
  let bestSingleDelta = Math.abs(rates[0] - effective)
  for (const r of rates) {
    const d = Math.abs(r - effective)
    if (d < bestSingleDelta) {
      bestSingleDelta = d
      bestSingle = r
    }
  }
  if (bestSingleDelta <= SINGLE_RATE_TOLERANCE) {
    return {
      breakdown: [{ rate: bestSingle, base: baseCents, vat: vatCents }],
      confidence: "exact",
      effectiveRate: bestSingle,
    }
  }

  // 2. Decomposição em duas taxas.
  let bestMix: { r1: number; r2: number; baseR1: number; baseR2: number; delta: number } | null = null
  for (let i = 0; i < rates.length; i++) {
    for (let j = i + 1; j < rates.length; j++) {
      const r1 = rates[i]
      const r2 = rates[j]
      // Resolve r1·x + r2·(B−x) = V em cêntimos: x = (V − r2·B / 100) / ((r1−r2)/100)
      const denom = (r1 - r2) / 100
      const numer = vatCents - (r2 * baseCents) / 100
      const x = numer / denom
      const y = baseCents - x
      if (x < MIN_LEG_CENTS || y < MIN_LEG_CENTS) continue

      // Verifica que a soma dos IVAs reproduz vatCents (deveria por
      // construção, mas arredondamentos podem doer).
      const vatComputed = Math.round((r1 * x) / 100) + Math.round((r2 * y) / 100)
      const delta = Math.abs(vatComputed - vatCents)
      if (!bestMix || delta < bestMix.delta) {
        bestMix = { r1, r2, baseR1: Math.round(x), baseR2: Math.round(y), delta }
      }
    }
  }
  if (bestMix && bestMix.delta <= 2) {
    // Tolerância 2 cêntimos — costuma ser arredondamento.
    return {
      breakdown: [
        {
          rate: bestMix.r1,
          base: bestMix.baseR1,
          vat: Math.round((bestMix.r1 * bestMix.baseR1) / 100),
        },
        {
          rate: bestMix.r2,
          base: bestMix.baseR2,
          vat: Math.round((bestMix.r2 * bestMix.baseR2) / 100),
        },
      ],
      confidence: "mixed",
      effectiveRate: effective,
    }
  }

  // 3. Best-effort: melhor taxa única (mesmo fora da tolerância).
  return {
    breakdown: [{ rate: bestSingle, base: baseCents, vat: vatCents }],
    confidence: "approx",
    effectiveRate: bestSingle,
  }
}

/** Atalho: devolve só a taxa principal (ou a ponderada em caso de mistura). */
export function inferVatRate(baseCents: number, vatCents: number, region: VatRegion = "mainland"): number {
  const r = inferVatBreakdown(baseCents, vatCents, region)
  if (r.breakdown.length === 1) return r.breakdown[0].rate
  // Para mistura, a taxa "representativa" é a efectiva, arredondada.
  return Math.round(r.effectiveRate * 100) / 100
}

/** vatBreakdown JSON pronto a guardar no campo Transaction.vatBreakdown. */
export function vatBreakdownJson(
  baseCents: number,
  vatCents: number,
  region: VatRegion = "mainland"
): { rate: number; base: number; vat: number }[] {
  const r = inferVatBreakdown(baseCents, vatCents, region)
  return r.breakdown.map((l) => ({
    rate: l.rate,
    base: l.base / 100,
    vat: l.vat / 100,
  }))
}
