-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "MonitoringStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "KeywordType" AS ENUM ('KEYWORD', 'HASHTAG', 'COMPETITOR', 'BRAND');

-- CreateEnum
CREATE TYPE "SentimentLabel" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNING',
    "color" TEXT,
    "imageUrl" TEXT,
    "objective" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsible" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_channels" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_posts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT,
    "thumbnailUrl" TEXT,
    "permalink" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_pages" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_ai_reports" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitorings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt',
    "country" TEXT NOT NULL DEFAULT 'BR',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MonitoringStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCollectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitorings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL DEFAULT 'KEYWORD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastCollectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT,
    "summary" TEXT,
    "author" TEXT,
    "sourceName" TEXT,
    "language" TEXT,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedKeyword" TEXT,
    "matchedBrand" TEXT,
    "matchedCompetitor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mention_sentiments" (
    "id" TEXT NOT NULL,
    "mentionId" TEXT NOT NULL,
    "sentiment" "SentimentLabel" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "theme" TEXT,
    "urgency" TEXT,
    "intent" TEXT,
    "entities" JSONB,
    "suggestedReply" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mention_sentiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_alert_rules" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listening_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_clientId_idx" ON "campaigns"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_channels_campaignId_channel_key" ON "campaign_channels"("campaignId", "channel");

-- CreateIndex
CREATE INDEX "campaign_posts_campaignId_idx" ON "campaign_posts"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_posts_campaignId_channel_externalId_key" ON "campaign_posts"("campaignId", "channel", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_pages_campaignId_pagePath_key" ON "campaign_pages"("campaignId", "pagePath");

-- CreateIndex
CREATE INDEX "campaign_ai_reports_campaignId_idx" ON "campaign_ai_reports"("campaignId");

-- CreateIndex
CREATE INDEX "monitorings_clientId_idx" ON "monitorings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_monitoringId_term_type_key" ON "keywords"("monitoringId", "term", "type");

-- CreateIndex
CREATE INDEX "sources_monitoringId_idx" ON "sources"("monitoringId");

-- CreateIndex
CREATE INDEX "mentions_monitoringId_publishedAt_idx" ON "mentions"("monitoringId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentions_monitoringId_urlHash_key" ON "mentions"("monitoringId", "urlHash");

-- CreateIndex
CREATE UNIQUE INDEX "mention_sentiments_mentionId_key" ON "mention_sentiments"("mentionId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analysis_monitoringId_period_periodKey_key" ON "ai_analysis"("monitoringId", "period", "periodKey");

-- CreateIndex
CREATE INDEX "listening_alert_rules_monitoringId_idx" ON "listening_alert_rules"("monitoringId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_channels" ADD CONSTRAINT "campaign_channels_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_posts" ADD CONSTRAINT "campaign_posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_pages" ADD CONSTRAINT "campaign_pages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_ai_reports" ADD CONSTRAINT "campaign_ai_reports_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorings" ADD CONSTRAINT "monitorings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mention_sentiments" ADD CONSTRAINT "mention_sentiments_mentionId_fkey" FOREIGN KEY ("mentionId") REFERENCES "mentions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_alert_rules" ADD CONSTRAINT "listening_alert_rules_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

