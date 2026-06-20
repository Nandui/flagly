import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

// Local date helper (month is 1-indexed for readability).
function dt(y: number, m: number, d: number, h: number, min: number): Date {
  return new Date(y, m - 1, d, h, min, 0, 0)
}

/**
 * Import the real Bishopstown incidents exported from the previous tool as a
 * starting point. Idempotent: the centre, areas and incidents are keyed on
 * their natural unique fields, so re-running this does not duplicate anything.
 *
 * Unlike `prisma/seed.ts` (demo data, which wipes the DB), this script is
 * additive — run it once against the real database:
 *
 *   DATABASE_URL=… DATABASE_URL_UNPOOLED=… npm run db:import
 */
async function main() {
  console.log("Importing Bishopstown incidents…")

  const center = await prisma.center.upsert({
    where: { siteCode: "BT" },
    update: {},
    create: {
      name: "LeisureWorld Bishopstown",
      siteCode: "BT",
      region: "IRELAND",
      address: "Bishopstown, Cork, Ireland",
    },
  })

  async function ensureArea(name: string, sortOrder: number) {
    return prisma.area.upsert({
      where: { centerId_name: { centerId: center.id, name } },
      update: {},
      create: { centerId: center.id, name, sortOrder },
    })
  }
  async function ensureSub(areaId: string, name: string, sortOrder: number) {
    return prisma.subArea.upsert({
      where: { areaId_name: { areaId, name } },
      update: {},
      create: { areaId, name, sortOrder },
    })
  }

  const poolHall = await ensureArea("Pool hall", 0)
  const poolDeck = await ensureSub(poolHall.id, "Pool deck", 0)
  const showers = await ensureSub(poolHall.id, "Showers", 1)
  const gym = await ensureArea("Gym", 1)

  async function importIncident(data: Prisma.IncidentUncheckedCreateInput) {
    const existing = await prisma.incident.findUnique({
      where: { reference: data.reference },
      select: { id: true },
    })
    if (existing) {
      console.log(`  ${data.reference} — already present, skipped`)
      return
    }
    await prisma.incident.create({ data })
    console.log(`  ${data.reference} — imported`)
  }

  // ── 2026-BT-INC-0001 ──────────────────────────────────────────────────────
  await importIncident({
    centerId: center.id,
    reference: "2026-BT-INC-0001",
    type: "HAZARDOUS_SUBSTANCE",
    status: "OPEN",
    severity: "SIGNIFICANT",
    occurredAt: dt(2026, 1, 12, 12, 45),
    createdAt: dt(2026, 1, 12, 13, 0),
    areaId: poolHall.id,
    subAreaId: poolDeck.id,
    location: poolHall.name,
    locationDetail: poolDeck.name,
    description:
      "Member LWB26571 (Brian Hourihan) approached the lifeguard table as Lily was doing the pool test and took one of the pool test tablets from the table. He ingested one as Lily tried to stop him. The carer came over to have a look and Jason got called to the pool deck and talked to the carer. Jason advised to drink water to rinse out his mouth and seek professional medical advice. The carer took Brian out of the pool and went to seek medical advice. 0879015875 — Jason will ring tomorrow to follow up with the carer.",
    reportedBy: "Jason Sheahan",
    injuredCount: 1,
    injuredParties: {
      create: [
        {
          partyType: "MEMBER",
          name: "Brian Hourihan",
          contactPhone: "0879015875",
          injuryNature: "Ingested a pool-test (DPD) reagent tablet",
          bodyPartAffected: "Mouth / ingestion",
          treatment: "GP_REFERRAL",
          additionalNotes:
            "Advised to drink water to rinse his mouth and seek professional medical advice. The carer removed him from the pool and went to seek medical advice. Member ref LWB26571.",
          lostTime: false,
        },
      ],
    },
    followUpActions: {
      create: [
        {
          description:
            "Ring the carer to follow up on Brian Hourihan after the pool-test tablet ingestion.",
          assignedTo: "Jason Sheahan",
          dueDate: dt(2026, 1, 13, 9, 0),
          status: "OPEN",
        },
      ],
    },
  })

  // ── 2026-BT-INC-0002 ──────────────────────────────────────────────────────
  await importIncident({
    centerId: center.id,
    reference: "2026-BT-INC-0002",
    type: "OTHER",
    status: "OPEN",
    severity: "SIGNIFICANT",
    occurredAt: dt(2026, 1, 13, 16, 0),
    createdAt: dt(2026, 1, 13, 16, 30),
    areaId: poolHall.id,
    subAreaId: showers.id,
    location: poolHall.name,
    locationDetail: showers.name,
    description:
      "There was a code amber but the child was found. The child never went into the lesson, she stayed in the showers for the duration of the lesson. The nan that brought the child never brought the child in or out to the lesson — she sent her younger sister into her. She was then screaming at the child when we found her, and I approached the nan and told her that it is mandatory that an adult needs to bring the child to pool deck and collect her from pool deck when the lesson is finished.",
    reportedBy: "David Yelverton",
  })

  // ── 2026-BT-INC-0003 ──────────────────────────────────────────────────────
  await importIncident({
    centerId: center.id,
    reference: "2026-BT-INC-0003",
    type: "OTHER",
    status: "OPEN",
    severity: "MINOR",
    occurredAt: dt(2026, 1, 14, 12, 30),
    createdAt: dt(2026, 1, 14, 12, 30),
    areaId: poolHall.id,
    location: poolHall.name,
    locationDetail: null,
    description:
      "Rachel Ahern, parent of Starfish 15:10 Monday student Maisie-Belle Galvin (LWB97112), reached out to reception asking for someone responsible for the swim lessons to call her, so I did. She said she moved her daughter from Saturday to Monday lessons because there was no consistency in the Saturday swim teachers. She said she was happy with this \"younger man\" that used to teach her daughter, but that on Monday the 12th the class was taught by a young lady who didn't teach anything, barely interacted with the kids, kept talking to the other teacher for the other Starfish at 15:10 and was looking at the clock all the time, seemingly to check when it would end. She said the class was a disgrace and that they spend too much money and come from too far away for that to be acceptable. I assured her I would look into it. After some investigation I discovered that the class was Sinead Gallagher's, and that this was her first class on her own. I also found out that the other teacher she was talking to was Csaba.",
    reportedBy: "Eduarda Brandao",
  })

  // ── 2026-BT-INC-0004 ──────────────────────────────────────────────────────
  await importIncident({
    centerId: center.id,
    reference: "2026-BT-INC-0004",
    type: "OTHER",
    status: "OPEN",
    severity: "MINOR",
    occurredAt: dt(2026, 1, 14, 12, 30),
    createdAt: dt(2026, 1, 14, 17, 0),
    areaId: gym.id,
    location: gym.name,
    locationDetail: null,
    description:
      "It was brought to my attention by Nikita this afternoon that Csaba was seen using the gym during his shift today at around 12:30. Apparently the reception team saw him on the cameras using dumbbells and cable machines in the gym in between teaching schools.",
    reportedBy: "Orla Sheerin",
  })

  console.log(`Import complete for ${center.name} (${center.siteCode}).`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
