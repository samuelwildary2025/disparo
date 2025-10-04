-- CreateTable
CREATE TABLE "CampaignStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "delayMinSeconds" INTEGER NOT NULL DEFAULT 0,
    "delayMaxSeconds" INTEGER NOT NULL DEFAULT 0,
    "waitForReplySeconds" INTEGER,
    "cancelIfReply" BOOLEAN NOT NULL DEFAULT false,
    "skipIfAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "typingMsOverride" INTEGER,
    "aiVariation" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchStep" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "campaignStepId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStep_campaignId_order_key" ON "CampaignStep"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchStep_dispatchId_campaignStepId_key" ON "DispatchStep"("dispatchId", "campaignStepId");

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchStep" ADD CONSTRAINT "DispatchStep_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "MessageDispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchStep" ADD CONSTRAINT "DispatchStep_campaignStepId_fkey" FOREIGN KEY ("campaignStepId") REFERENCES "CampaignStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
