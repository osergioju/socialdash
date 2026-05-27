-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "OAuthPlatform" AS ENUM ('META', 'GOOGLE_ANALYTICS', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'LINKEDIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_connections" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" "OAuthPlatform" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accountId" TEXT,
    "accountName" TEXT,
    "accountEmail" TEXT,
    "metadata" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_metrics" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "seguidores" INTEGER NOT NULL,
    "novosSeguidores" INTEGER NOT NULL,
    "alcanceOrganico" INTEGER NOT NULL,
    "visualizacoes" INTEGER NOT NULL,
    "interacoes" INTEGER NOT NULL,
    "visitasPerfil" INTEGER NOT NULL,
    "postagensTotal" INTEGER NOT NULL,
    "reelsQtd" INTEGER NOT NULL,
    "reelsAlcance" INTEGER NOT NULL,
    "reelsInteracoes" INTEGER NOT NULL,
    "storiesQtd" INTEGER NOT NULL,
    "storiesViews" INTEGER NOT NULL,
    "curtidasPosts" INTEGER NOT NULL,
    "comentariosPosts" INTEGER NOT NULL,
    "salvamentosPosts" INTEGER NOT NULL,
    "compartilhamentosPosts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_metrics" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "seguidores" INTEGER NOT NULL,
    "novosSeguidores" INTEGER NOT NULL,
    "alcance" INTEGER NOT NULL,
    "impressoes" INTEGER NOT NULL,
    "engajamento" INTEGER NOT NULL,
    "cliques" INTEGER NOT NULL,
    "reacoes" INTEGER NOT NULL,
    "postagens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ga4_metrics" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "usuariosAtivos" INTEGER NOT NULL,
    "novosUsuarios" INTEGER NOT NULL,
    "usuariosTotais" INTEGER NOT NULL,
    "sessoes" INTEGER NOT NULL,
    "sessoesEngajadas" INTEGER NOT NULL,
    "taxaEngajamento" DOUBLE PRECISION NOT NULL,
    "tempoMedioEngajamento" INTEGER NOT NULL,
    "tempoMedioSessao" INTEGER,
    "viewsPorSessao" DOUBLE PRECISION NOT NULL,
    "numEventos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ga4_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_metrics" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "seguidores" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_metrics" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "curtidas" INTEGER,
    "comentarios" INTEGER,
    "compartilhamentos" INTEGER,
    "alcanceMedio" INTEGER,
    "engajamento" INTEGER,
    "cliques" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ga4_pages" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "pagina" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ga4_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ga4_page_metrics" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "views" INTEGER,
    "tempoMedio" INTEGER,

    CONSTRAINT "ga4_page_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ga4_origins" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,

    CONSTRAINT "ga4_origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ga4_origin_metrics" (
    "id" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "sessoes" INTEGER,
    "taxaEng" DOUBLE PRECISION,
    "tempoMedio" INTEGER,

    CONSTRAINT "ga4_origin_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_industries" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "linkedin_industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_industry_metrics" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "seguidores" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_industry_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_roles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "linkedin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_role_metrics" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "seguidores" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_role_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");

-- CreateIndex
CREATE INDEX "clients_createdById_idx" ON "clients"("createdById");

-- CreateIndex
CREATE INDEX "platform_connections_status_idx" ON "platform_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_connections_clientId_platform_key" ON "platform_connections"("clientId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_clientId_email_key" ON "client_users"("clientId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_metrics_clientId_month_key" ON "instagram_metrics"("clientId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_metrics_clientId_month_key" ON "linkedin_metrics"("clientId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ga4_metrics_clientId_month_key" ON "ga4_metrics"("clientId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "cities_clientId_name_platform_key" ON "cities"("clientId", "name", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "city_metrics_cityId_month_key" ON "city_metrics"("cityId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "themes_clientId_platform_tema_key" ON "themes"("clientId", "platform", "tema");

-- CreateIndex
CREATE UNIQUE INDEX "theme_metrics_themeId_month_key" ON "theme_metrics"("themeId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ga4_pages_clientId_pagina_key" ON "ga4_pages"("clientId", "pagina");

-- CreateIndex
CREATE UNIQUE INDEX "ga4_page_metrics_pageId_month_key" ON "ga4_page_metrics"("pageId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ga4_origins_clientId_fonte_key" ON "ga4_origins"("clientId", "fonte");

-- CreateIndex
CREATE UNIQUE INDEX "ga4_origin_metrics_originId_month_key" ON "ga4_origin_metrics"("originId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_industries_clientId_nome_key" ON "linkedin_industries"("clientId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_industry_metrics_industryId_month_key" ON "linkedin_industry_metrics"("industryId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_roles_clientId_nome_key" ON "linkedin_roles"("clientId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_role_metrics_roleId_month_key" ON "linkedin_role_metrics"("roleId", "month");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_metrics" ADD CONSTRAINT "instagram_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_metrics" ADD CONSTRAINT "linkedin_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_metrics" ADD CONSTRAINT "ga4_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_metrics" ADD CONSTRAINT "city_metrics_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_metrics" ADD CONSTRAINT "theme_metrics_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_pages" ADD CONSTRAINT "ga4_pages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_page_metrics" ADD CONSTRAINT "ga4_page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ga4_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_origins" ADD CONSTRAINT "ga4_origins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ga4_origin_metrics" ADD CONSTRAINT "ga4_origin_metrics_originId_fkey" FOREIGN KEY ("originId") REFERENCES "ga4_origins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_industries" ADD CONSTRAINT "linkedin_industries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_industry_metrics" ADD CONSTRAINT "linkedin_industry_metrics_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "linkedin_industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_roles" ADD CONSTRAINT "linkedin_roles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_role_metrics" ADD CONSTRAINT "linkedin_role_metrics_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "linkedin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

