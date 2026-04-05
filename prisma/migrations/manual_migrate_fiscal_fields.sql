-- Migração manual: mover dados de extra JSONB para colunas dedicadas
-- Executar APÓS a migração Prisma que cria as novas colunas

-- Migrar NIF do fornecedor
UPDATE transactions
SET nif = extra->>'nif'
WHERE extra IS NOT NULL
  AND extra->>'nif' IS NOT NULL
  AND extra->>'nif' != ''
  AND nif IS NULL;

-- Migrar subtotal (converter de EUR para cêntimos)
UPDATE transactions
SET subtotal = ROUND((extra->>'subtotal')::numeric * 100)::int
WHERE extra IS NOT NULL
  AND extra->>'subtotal' IS NOT NULL
  AND extra->>'subtotal' != ''
  AND subtotal IS NULL;

-- Migrar vat_amount (converter de EUR para cêntimos)
UPDATE transactions
SET vat_amount = ROUND((extra->>'vat')::numeric * 100)::int
WHERE extra IS NOT NULL
  AND extra->>'vat' IS NOT NULL
  AND extra->>'vat' != ''
  AND vat_amount IS NULL;

-- Migrar vat_rate
UPDATE transactions
SET vat_rate = (extra->>'vat_rate')::numeric
WHERE extra IS NOT NULL
  AND extra->>'vat_rate' IS NOT NULL
  AND extra->>'vat_rate' != ''
  AND vat_rate IS NULL;

-- Migrar vat_breakdown (já é JSON)
UPDATE transactions
SET vat_breakdown = (extra->>'vat_breakdown')::jsonb
WHERE extra IS NOT NULL
  AND extra->>'vat_breakdown' IS NOT NULL
  AND extra->>'vat_breakdown' != ''
  AND extra->>'vat_breakdown' != '[]'
  AND vat_breakdown IS NULL;

-- Limpar campos migrados do extra JSONB
UPDATE transactions
SET extra = extra - 'nif' - 'subtotal' - 'vat' - 'vat_rate' - 'vat_breakdown'
WHERE extra IS NOT NULL
  AND (extra ? 'nif' OR extra ? 'subtotal' OR extra ? 'vat' OR extra ? 'vat_rate' OR extra ? 'vat_breakdown');
