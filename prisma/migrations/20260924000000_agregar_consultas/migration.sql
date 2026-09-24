-- CreateEnum
CREATE TYPE "CanalRespuesta" AS ENUM ('instagram', 'email');

-- CreateEnum
CREATE TYPE "ConsultaEstado" AS ENUM ('nueva', 'respondida', 'archivada');

-- CreateTable
CREATE TABLE "Consulta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "canal" "CanalRespuesta" NOT NULL,
    "instagram" TEXT,
    "email" TEXT,
    "mensaje" TEXT NOT NULL,
    "origen" TEXT,
    "estado" "ConsultaEstado" NOT NULL DEFAULT 'nueva',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consulta_estado_createdAt_idx" ON "Consulta"("estado", "createdAt");

