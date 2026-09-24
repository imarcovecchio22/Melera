-- CreateEnum
CREATE TYPE "CoincidenciaRegla" AS ENUM ('contiene', 'exacta');

-- CreateEnum
CREATE TYPE "CanalRegla" AS ENUM ('dm', 'comentario', 'ambos');

-- CreateEnum
CREATE TYPE "TipoEventoIG" AS ENUM ('dm', 'comentario');

-- CreateEnum
CREATE TYPE "AccionEventoIG" AS ENUM ('procesando', 'respondido', 'sin_coincidencia', 'ignorado', 'error');

-- CreateTable
CREATE TABLE "AutoRespuesta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "palabrasClave" TEXT[],
    "coincidencia" "CoincidenciaRegla" NOT NULL DEFAULT 'contiene',
    "canal" "CanalRegla" NOT NULL DEFAULT 'ambos',
    "respuesta" TEXT NOT NULL,
    "botones" JSONB NOT NULL DEFAULT '[]',
    "respuestaPublicaComentario" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoRespuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramEvento" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoEventoIG" NOT NULL,
    "externalId" TEXT NOT NULL,
    "usuarioIgId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "reglaId" INTEGER,
    "accion" "AccionEventoIG" NOT NULL DEFAULT 'procesando',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramToken" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "envHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramEvento_externalId_key" ON "InstagramEvento"("externalId");

-- CreateIndex
CREATE INDEX "InstagramEvento_createdAt_idx" ON "InstagramEvento"("createdAt");

-- CreateIndex
CREATE INDEX "InstagramEvento_usuarioIgId_reglaId_createdAt_idx" ON "InstagramEvento"("usuarioIgId", "reglaId", "createdAt");

-- AddForeignKey
ALTER TABLE "InstagramEvento" ADD CONSTRAINT "InstagramEvento_reglaId_fkey" FOREIGN KEY ("reglaId") REFERENCES "AutoRespuesta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

