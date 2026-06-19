-- CreateEnum
CREATE TYPE "Region" AS ENUM ('IRELAND', 'NORTHERN_IRELAND', 'GREAT_BRITAIN');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ACCIDENT', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'VIOLENCE_AGGRESSION', 'HAZARDOUS_SUBSTANCE', 'FIRE_OR_EVACUATION', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'OPEN', 'UNDER_INVESTIGATION', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('MINOR', 'SIGNIFICANT', 'REPORTABLE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InjuredPartyType" AS ENUM ('STAFF', 'MEMBER', 'CONTRACTOR', 'VISITOR', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TreatmentGiven" AS ENUM ('NONE', 'FIRST_AID_ONLY', 'GP_REFERRAL', 'HOSPITAL_AE', 'HOSPITAL_ADMITTED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ReportingAuthority" AS ENUM ('HSA_IRELAND', 'HSENI', 'HSE_UK');

-- CreateEnum
CREATE TYPE "RiddorStatus" AS ENUM ('PENDING', 'REPORTED', 'OVERDUE');

-- CreateTable
CREATE TABLE "Center" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteCode" TEXT,
    "region" "Region" NOT NULL DEFAULT 'IRELAND',
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Viewer',
    "centerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DRAFT',
    "severity" "IncidentSeverity" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "locationDetail" TEXT,
    "description" TEXT NOT NULL,
    "immediateAction" TEXT,
    "reportedBy" TEXT NOT NULL,
    "reportedById" TEXT,
    "witnessCount" INTEGER NOT NULL DEFAULT 0,
    "injuredCount" INTEGER NOT NULL DEFAULT 0,
    "riddorRequired" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closureNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Witness" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleOrRelation" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "statement" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Witness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InjuredParty" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "partyType" "InjuredPartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "injuryNature" TEXT NOT NULL,
    "bodyPartAffected" TEXT NOT NULL,
    "treatment" "TreatmentGiven" NOT NULL,
    "hospitalName" TEXT,
    "gpReferral" BOOLEAN NOT NULL DEFAULT false,
    "lostTime" BOOLEAN NOT NULL DEFAULT false,
    "lostTimeDays" INTEGER,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InjuredParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpAction" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiddorFlag" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "authority" "ReportingAuthority" NOT NULL,
    "classification" TEXT NOT NULL,
    "reportingDeadline" TIMESTAMP(3) NOT NULL,
    "status" "RiddorStatus" NOT NULL DEFAULT 'PENDING',
    "reportedAt" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "reportedBy" TEXT,
    "method" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiddorFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Center_siteCode_key" ON "Center"("siteCode");

-- CreateIndex
CREATE INDEX "Center_siteCode_idx" ON "Center"("siteCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_centerId_idx" ON "User"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_reference_key" ON "Incident"("reference");

-- CreateIndex
CREATE INDEX "Incident_centerId_idx" ON "Incident"("centerId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_occurredAt_idx" ON "Incident"("occurredAt");

-- CreateIndex
CREATE INDEX "Incident_riddorRequired_idx" ON "Incident"("riddorRequired");

-- CreateIndex
CREATE INDEX "Witness_incidentId_idx" ON "Witness"("incidentId");

-- CreateIndex
CREATE INDEX "InjuredParty_incidentId_idx" ON "InjuredParty"("incidentId");

-- CreateIndex
CREATE INDEX "FollowUpAction_incidentId_idx" ON "FollowUpAction"("incidentId");

-- CreateIndex
CREATE INDEX "FollowUpAction_status_idx" ON "FollowUpAction"("status");

-- CreateIndex
CREATE INDEX "FollowUpAction_dueDate_idx" ON "FollowUpAction"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RiddorFlag_incidentId_key" ON "RiddorFlag"("incidentId");

-- CreateIndex
CREATE INDEX "RiddorFlag_status_idx" ON "RiddorFlag"("status");

-- CreateIndex
CREATE INDEX "RiddorFlag_reportingDeadline_idx" ON "RiddorFlag"("reportingDeadline");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Witness" ADD CONSTRAINT "Witness_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InjuredParty" ADD CONSTRAINT "InjuredParty_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpAction" ADD CONSTRAINT "FollowUpAction_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiddorFlag" ADD CONSTRAINT "RiddorFlag_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
