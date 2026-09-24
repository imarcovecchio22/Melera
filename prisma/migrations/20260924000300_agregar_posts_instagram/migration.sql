-- CreateEnum
CREATE TYPE "TipoPostIG" AS ENUM ('presentacion', 'producto', 'dato');

-- CreateEnum
CREATE TYPE "EstiloPostIG" AS ENUM ('organico', 'geo');

-- CreateEnum
CREATE TYPE "EstadoPostIG" AS ENUM ('pendiente', 'generando', 'esperando_aprobacion', 'publicando', 'publicado', 'descartado', 'error');

-- CreateEnum
CREATE TYPE "DestinoPostIG" AS ENUM ('feed', 'story', 'both');

-- CreateTable
CREATE TABLE "PostIG" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoPostIG" NOT NULL,
    "estilo" "EstiloPostIG" NOT NULL,
    "tema" TEXT NOT NULL,
    "nombreProducto" TEXT,
    "categoria" TEXT,
    "precio" TEXT,
    "presentacion" TEXT,
    "imagenUrl" TEXT,
    "estado" "EstadoPostIG" NOT NULL DEFAULT 'pendiente',
    "copy" JSONB,
    "caption" TEXT,
    "feedUrl" TEXT,
    "storyUrl" TEXT,
    "destino" "DestinoPostIG",
    "feedMediaId" TEXT,
    "storyMediaId" TEXT,
    "telegramMessageId" INTEGER,
    "error" TEXT,
    "generadoEn" TIMESTAMP(3),
    "publicadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostIG_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostIG_estado_fecha_idx" ON "PostIG"("estado", "fecha");

