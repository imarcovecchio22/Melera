-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "escalones" JSONB NOT NULL DEFAULT '[]';


-- Promos iniciales: 5 frascos por $30.000 ($6.000 c/u) y 10 frascos por $55.000 ($5.500 c/u).
-- Se editan desde /admin/stock.
UPDATE "Product" SET "escalones" = '[{"desde":5,"precio":6000},{"desde":10,"precio":5500}]'::jsonb;
