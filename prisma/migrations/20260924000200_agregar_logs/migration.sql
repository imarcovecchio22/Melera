-- CreateEnum
CREATE TYPE "LogNivel" AS ENUM ('info', 'warn', 'error');

-- CreateTable
CREATE TABLE "EventLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel" "LogNivel" NOT NULL DEFAULT 'info',
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "detalle" JSONB,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE INDEX "EventLog_nivel_createdAt_idx" ON "EventLog"("nivel", "createdAt");

-- CreateIndex
CREATE INDEX "EventLog_tipo_createdAt_idx" ON "EventLog"("tipo", "createdAt");

