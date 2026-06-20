import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { addDays, set, subDays, subMonths } from "date-fns"

const prisma = new PrismaClient()

const now = new Date()
function at(base: Date, hour: number, minute: number): Date {
  return set(base, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 })
}

// ─── Area helpers ──────────────────────────────────────────────────────────────

type AreaMap = Map<string, { id: string; subs: Map<string, string> }>

async function seedAreas(
  centerId: string,
  defs: { name: string; subs: string[] }[]
): Promise<AreaMap> {
  const map: AreaMap = new Map()
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i]
    const area = await prisma.area.create({
      data: { centerId, name: def.name, sortOrder: i },
      select: { id: true },
    })
    const subs = new Map<string, string>()
    for (let j = 0; j < def.subs.length; j++) {
      const sub = await prisma.subArea.create({
        data: { areaId: area.id, name: def.subs[j], sortOrder: j },
        select: { id: true },
      })
      subs.set(def.subs[j], sub.id)
    }
    map.set(def.name, { id: area.id, subs })
  }
  return map
}

// Resolve an (area, sub-area) pair into the incident location fields:
// the FK ids plus the denormalised name copies stored on the incident.
function locator(map: AreaMap) {
  return (areaName: string, subName?: string) => {
    const area = map.get(areaName)
    if (!area) throw new Error(`Unknown area: ${areaName}`)
    const subAreaId = subName ? (area.subs.get(subName) ?? null) : null
    if (subName && !subAreaId) {
      throw new Error(`Unknown sub-area "${subName}" in "${areaName}"`)
    }
    return {
      areaId: area.id,
      subAreaId,
      location: areaName,
      locationDetail: subName ?? null,
    }
  }
}

async function main() {
  console.log("Clearing existing data…")
  await prisma.followUpAction.deleteMany()
  await prisma.witness.deleteMany()
  await prisma.injuredParty.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.subArea.deleteMany()
  await prisma.area.deleteMany()
  await prisma.user.deleteMany()
  await prisma.center.deleteMany()

  console.log("Creating centres…")
  const cork = await prisma.center.create({
    data: {
      name: "LeisureWorld Cork",
      siteCode: "LW",
      region: "IRELAND",
      address: "Bishopstown, Cork, Ireland",
    },
  })
  const dublin = await prisma.center.create({
    data: {
      name: "LeisureWorld Dublin",
      siteCode: "LD",
      region: "IRELAND",
      address: "Tallaght, Dublin, Ireland",
    },
  })

  console.log("Creating areas & sub-areas…")
  const corkAreas = await seedAreas(cork.id, [
    { name: "Pool hall", subs: ["Poolside, deep end", "Poolside, shallow end"] },
    { name: "Changing village", subs: ["Showers corridor", "Lockers"] },
    { name: "Gym floor", subs: ["Free-weights area", "Cardio area"] },
    { name: "Sports hall", subs: ["Court 2", "Equipment store"] },
    { name: "Reception", subs: ["Entrance", "Front desk"] },
    { name: "Plant room", subs: ["Chemical dosing area"] },
  ])
  const loc = locator(corkAreas)

  // A second centre with its own areas (no incidents yet) so the admin screen
  // shows the per-centre separation.
  await seedAreas(dublin.id, [
    { name: "Pool hall", subs: ["Main pool", "Toddler pool"] },
    { name: "Gym floor", subs: [] },
    { name: "Reception", subs: [] },
  ])

  console.log("Creating demo users…")
  const passwordHash = await bcrypt.hash("password123", 10)

  // Operations Manager (the admin) — Fernando's account, across both centres.
  await prisma.user.create({
    data: {
      name: "Fernando Serina",
      email: "fernandoserina@leisureworldcork.com",
      passwordHash,
      role: "Operations Manager",
      centers: { connect: [{ id: cork.id }, { id: dublin.id }] },
    },
  })

  // Reporter of the demo incidents, plus a couple more staff accounts.
  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Brennan",
      email: "manager@leisureworld.ie",
      passwordHash,
      role: "Duty Manager",
      centers: { connect: { id: cork.id } },
    },
  })
  await prisma.user.create({
    data: {
      name: "John Fitzgerald",
      email: "john.fitzgerald@leisureworld.ie",
      passwordHash,
      role: "Duty Manager",
      centers: { connect: { id: cork.id } },
    },
  })
  await prisma.user.create({
    data: {
      name: "Mark Doyle",
      email: "mark.doyle@leisureworld.ie",
      passwordHash,
      role: "Shift Supervisor",
      centers: { connect: { id: cork.id } },
    },
  })

  const reporter = sarah.name
  let seq = 0
  const ref = () => `INC-LW-${String(++seq).padStart(4, "0")}`

  console.log("Creating incidents…")

  // 1 — MINOR accident · slip · CLOSED
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "ACCIDENT",
      status: "CLOSED",
      severity: "MINOR",
      occurredAt: at(subMonths(now, 5), 9, 40),
      ...loc("Changing village", "Showers corridor"),
      description:
        "A member slipped on a wet patch of floor in the corridor between the showers and the pool hall. They sat down heavily but were able to get up unaided. First aid offered and declined.",
      immediateAction:
        "Wet floor signs placed, area mopped, member checked over by the duty lifeguard.",
      reportedBy: reporter,
      witnessCount: 1,
      injuredCount: 0,
      closedAt: at(subMonths(now, 5), 14, 0),
      closedBy: reporter,
      closureNotes:
        "No injury sustained. Additional non-slip matting installed in the corridor. Closed.",
      witnesses: {
        create: [
          {
            name: "Liam Kelly",
            roleOrRelation: "Lifeguard on duty",
            contactPhone: "021 555 0101",
            statement:
              "I saw the member slip near the showers. They got up straight away and seemed fine. I placed wet floor signs and mopped the area.",
            statementDate: at(subMonths(now, 5), 10, 5),
          },
        ],
      },
    },
  })

  // 2 — MINOR accident · cut · OPEN
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "ACCIDENT",
      status: "OPEN",
      severity: "MINOR",
      occurredAt: at(subMonths(now, 4), 17, 25),
      ...loc("Gym floor", "Free-weights area"),
      description:
        "A member caught their shin on the edge of a weights bench, causing a small laceration. First aid administered on site.",
      immediateAction: "Cleaned and dressed the wound with a plaster from the first aid kit.",
      reportedBy: reporter,
      witnessCount: 0,
      injuredCount: 1,
      injuredParties: {
        create: [
          {
            partyType: "MEMBER",
            name: "Tomás Ó Briain",
            contactPhone: "086 555 0142",
            injuryNature: "Minor laceration",
            bodyPartAffected: "Right shin",
            treatment: "FIRST_AID_ONLY",
            lostTime: false,
          },
        ],
      },
    },
  })

  // 3 — MINOR accident · slip · DRAFT
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "ACCIDENT",
      status: "DRAFT",
      severity: "MINOR",
      occurredAt: at(subDays(now, 2), 11, 10),
      ...loc("Reception", "Entrance"),
      description:
        "Visitor slipped on rainwater near the entrance. Drafting report — awaiting details.",
      reportedBy: reporter,
      witnessCount: 0,
      injuredCount: 0,
    },
  })

  // 4 — NEAR_MISS · pool chemical · UNDER_INVESTIGATION
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "NEAR_MISS",
      status: "UNDER_INVESTIGATION",
      severity: "SIGNIFICANT",
      occurredAt: at(subMonths(now, 3), 7, 15),
      ...loc("Plant room", "Chemical dosing area"),
      description:
        "During a delivery, a container of sodium hypochlorite was nearly knocked over next to the acid dosing line. Had the two mixed, chlorine gas could have been released. No spill occurred.",
      immediateAction:
        "Delivery paused, containers re-secured and segregated. Plant room ventilation checked.",
      reportedBy: reporter,
      witnessCount: 1,
      injuredCount: 0,
      witnesses: {
        create: [
          {
            name: "Mark Doyle",
            roleOrRelation: "Maintenance technician",
            contactEmail: "mark.doyle@leisureworld.ie",
            statement:
              "The delivery driver placed the hypochlorite drum too close to the acid line. I moved it immediately and we agreed a new delivery procedure.",
            statementDate: at(subMonths(now, 3), 8, 0),
          },
        ],
      },
      followUpActions: {
        create: [
          {
            description:
              "Introduce a segregated, labelled storage zone for incompatible pool chemicals.",
            assignedTo: "Mark Doyle",
            dueDate: addDays(now, 10),
            status: "IN_PROGRESS",
          },
        ],
      },
    },
  })

  // 5 — NEAR_MISS · equipment failure · DRAFT
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "NEAR_MISS",
      status: "DRAFT",
      severity: "MINOR",
      occurredAt: at(subDays(now, 1), 19, 45),
      ...loc("Gym floor", "Cardio area"),
      description:
        "Treadmill belt stopped abruptly mid-use. User kept their balance and was not hurt. Machine taken out of service pending inspection.",
      reportedBy: reporter,
      witnessCount: 0,
      injuredCount: 0,
    },
  })

  // 6 — SIGNIFICANT · suspected fractured wrist · UNDER_INVESTIGATION
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "ACCIDENT",
      status: "UNDER_INVESTIGATION",
      severity: "SIGNIFICANT",
      occurredAt: at(subMonths(now, 1), 18, 5),
      ...loc("Sports hall", "Court 2"),
      description:
        "A member fell awkwardly while reaching for a shuttle and landed on an outstretched hand. They reported immediate pain and swelling to the wrist. Suspected fracture.",
      immediateAction:
        "Ice applied, wrist immobilised, member advised to attend A&E. A taxi was arranged.",
      reportedBy: reporter,
      witnessCount: 2,
      injuredCount: 1,
      injuredParties: {
        create: [
          {
            partyType: "MEMBER",
            name: "Aoife Nolan",
            contactPhone: "087 555 0199",
            contactEmail: "aoife.nolan@example.com",
            injuryNature: "Suspected fractured wrist",
            bodyPartAffected: "Left wrist",
            treatment: "HOSPITAL_AE",
            hospitalName: "Mercy University Hospital, Cork",
            lostTime: false,
          },
        ],
      },
      witnesses: {
        create: [
          {
            name: "Ciara Walsh",
            roleOrRelation: "Member (playing partner)",
            contactPhone: "085 555 0177",
            statement:
              "Aoife lunged for the shuttle and fell onto her hand. She was in a lot of pain and couldn't move her wrist properly.",
            statementDate: at(subMonths(now, 1), 18, 30),
          },
          {
            name: "John Fitzgerald",
            roleOrRelation: "Duty manager",
            contactEmail: "john.fitzgerald@leisureworld.ie",
            statement:
              "I responded to the call, immobilised the wrist and arranged a taxi to A&E. The court surface was dry and in good condition.",
            statementDate: at(subMonths(now, 1), 19, 0),
          },
        ],
      },
      followUpActions: {
        create: [
          {
            description:
              "Obtain the member's hospital outcome and follow up on their recovery.",
            assignedTo: "John Fitzgerald",
            dueDate: addDays(now, 7),
            status: "OPEN",
          },
        ],
      },
    },
  })

  // 7 — REPORTABLE · staff absence over 3 days · OPEN
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "ACCIDENT",
      status: "OPEN",
      severity: "REPORTABLE",
      occurredAt: at(subDays(now, 21), 8, 50),
      ...loc("Pool hall", "Poolside, deep end"),
      description:
        "A lifeguard slipped on the wet poolside while responding to a swimmer and twisted their ankle badly. They were unable to continue their shift and have been absent from normal duties for more than three consecutive days.",
      immediateAction:
        "Ankle iced and elevated, lifeguard relieved of duty and advised to attend their GP / A&E.",
      reportedBy: reporter,
      witnessCount: 1,
      injuredCount: 1,
      injuredParties: {
        create: [
          {
            partyType: "STAFF",
            name: "Niamh Murphy",
            contactPhone: "086 555 0123",
            contactEmail: "niamh.murphy@leisureworld.ie",
            injuryNature: "Severe ankle sprain / suspected ligament damage",
            bodyPartAffected: "Right ankle",
            treatment: "HOSPITAL_AE",
            hospitalName: "Cork University Hospital",
            lostTime: true,
            lostTimeDays: 6,
          },
        ],
      },
      witnesses: {
        create: [
          {
            name: "David O'Connor",
            roleOrRelation: "Senior lifeguard",
            contactPhone: "087 555 0188",
            statement:
              "Niamh was hurrying along the poolside and slipped on a wet patch. Her ankle gave way and she couldn't put weight on it.",
            statementDate: at(subDays(now, 21), 9, 30),
          },
        ],
      },
      followUpActions: {
        create: [
          {
            description:
              "Review poolside anti-slip surfacing and lifeguard footwear policy.",
            assignedTo: "John Fitzgerald",
            dueDate: addDays(now, 12),
            status: "COMPLETE",
            completedAt: subDays(now, 2),
            completedBy: "John Fitzgerald",
            notes: "Anti-slip audit completed; new footwear ordered for all guards.",
          },
          {
            description:
              "Escalate the over-3-day staff injury to senior management for review.",
            assignedTo: "Sarah Brennan",
            dueDate: subDays(now, 1),
            status: "OVERDUE",
          },
        ],
      },
    },
  })

  // 8 — PROPERTY_DAMAGE · fire extinguisher discharge · OPEN
  await prisma.incident.create({
    data: {
      centerId: cork.id,
      reference: ref(),
      type: "PROPERTY_DAMAGE",
      status: "OPEN",
      severity: "MINOR",
      occurredAt: at(subMonths(now, 2), 15, 30),
      ...loc("Sports hall", "Equipment store"),
      description:
        "A dry powder fire extinguisher was knocked from its bracket and discharged across the equipment store, coating stored mats and equipment in powder. No fire and no injuries.",
      immediateAction:
        "Area ventilated and cordoned. Affected equipment removed for cleaning. Extinguisher quarantined for replacement.",
      reportedBy: reporter,
      witnessCount: 0,
      injuredCount: 0,
      followUpActions: {
        create: [
          {
            description: "Replace the discharged extinguisher and re-secure all brackets.",
            assignedTo: "Mark Doyle",
            dueDate: addDays(now, 3),
            status: "OPEN",
          },
        ],
      },
    },
  })

  // The demo incidents are reported by Sarah — link them to her account so the
  // reporter shows as a real user (and the edit form preselects it).
  await prisma.incident.updateMany({ data: { reportedById: sarah.id } })

  console.log(`Seed complete: 2 centres, 4 users, ${seq} incidents at ${cork.name}.`)
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
