import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../app/generated/prisma/client"

type SeedRow = {
  weekKey: string
  expectedTotal: number
  savings: number
  cashReserve: number
  investments: number
  mintos: number
  bondora: number
  legacyDegiro: number
  alpaca: number
  bankAccount: number
  card: number
}

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://mikepage:mikepage@localhost:5432/mikepage",
})

const prisma = new PrismaClient({ adapter })

const rows: SeedRow[] = [
  row("23_09", 9569, 1021, 0, 0, 3092, 554, 2, 0, 2611, 2289),
  row("23_10", 9107, 1021, 0, 0, 3095, 554, 2, 0, 2581, 1854),
  row("23_11", 8698, 1021, 0, 0, 3108, 554, 2, 0, 2451, 1562),
  row("23_12", 12650, 1021, 0, 0, 3115, 554, 2, 0, 6805, 1153),
  row("23_13", 9742, 814, 245, 0, 3373, 554, 252, 0, 3030, 1474),
  row("23_14", 8953, 1474, 257, 0, 3381, 556, 245, 0, 2633, 407),
  row("23_15", 8575, 1474, 259, 0, 3384, 556, 247, 0, 2456, 199),
  row("23_16", 8199, 1474, 234, 0, 3370, 556, 247, 0, 2272, 46),
  row("23_17", 10957, 1700, 241, 0, 3376, 558, 250, 0, 3592, 1240),
  row("23_18", 10192, 1700, 233, 0, 3391, 559, 254, 0, 3501, 554),
  row("23_20", 10010, 1700, 230, 0, 3395, 559, 257, 0, 3476, 393),
  row("23_21", 13641, 3200, 233, 0, 3405, 560, 257, 0, 4694, 1292),
  row("23_22", 11523, 3200, 236, 0, 3414, 560, 263, 0, 2642, 1208),
  row("23_24", 10658, 3237, 226, 0, 3427, 561, 263, 0, 2590, 354),
  row("23_30", 11303, 4537, 236, 0, 3456, 563, 265, 0, 1579, 667),
  row("23_34", 13320, 5837, 229, 0, 3496, 564, 495, 0, 2118, 581),
  row("23_35", 17551, 7137, 234, 0, 3529, 566, 496, 0, 4426, 1163),
  row("23_29", 18337, 8437, 233, 0, 3765, 567, 1226, 0, 3309, 800),
  row("23_40", 17817, 8437, 243, 0, 3771, 567, 1226, 0, 3114, 459),
  row("23_42", 16489, 8437, 216, 0, 3789, 568, 1199, 0, 1719, 561),
  row("23_44", 19239, 10087, 238, 0, 4103, 568, 1544, 0, 2345, 354),
  row("23_45", 19402, 10087, 238, 0, 4109, 568, 1623, 0, 2495, 282),
  row("23_46", 27693, 11387, 248, 0, 4136, 567, 1627, 0, 8943, 785),
  row("24_02", 24191, 12224, 274, 0, 4496, 568, 1834, 0, 4413, 382),
  row("24_04", 26747, 13024, 274, 0, 5018, 569, 1923, 0, 5337, 602),
  row("24_05", 28992, 13024, 737, 1950, 5026, 569, 2385, 0, 4871, 430),
  row("24_06", 28778, 13024, 771, 1950, 5033, 569, 2517, 0, 4675, 239),
  row("24_07", 27387, 13024, 777, 1950, 5049, 569, 2431, 0, 3553, 34),
  row("24_08", 32463, 13024, 807, 1950, 5059, 569, 2470, 0, 7924, 660),
  row("24_09", 30848, 13724, 969, 1950, 5376, 569, 3080, 0, 4958, 222),
  row("24_14", 31233, 14224, 1692, 1500, 5714, 571, 3603, 0, 3430, 499),
  row("24_23", 31987, 15424, 420, 1350, 6390, 570, 3600, 1048, 2670, 515),
  row("24_26", 34094, 14524, 420, 2350, 6414, 570, 5403, 1346, 1763, 1304),
  row("24_29", 31645, 10924, 2000, 2350, 6444, 570, 5455, 1383, 1966, 553),
  row("24_33", 34267, 8664, 1000, 2350, 6687, 570, 6619, 5030, 2741, 606),
  row("24_36", 34450, 10664, 1000, 2350, 6679, 570, 6200, 5093, 1657, 237),
  row("24_36", 34899, 10664, 1000, 2350, 6742, 570, 6500, 5361, 1619, 93),
  row("24_40", 37562, 12664, 1000, 2350, 6857, 573, 6745, 5587, 1403, 383),
  row("24_46", 40193, 16364, 300, 2000, 7042, 573, 7294, 5906, 614, 100),
  row("24_48", 49301, 21114, 150, 2000, 7109, 574, 7434, 6270, 3876, 774),
  row("25_02", 53133, 19198, 323, 3000, 7171, 574, 8386, 10644, 3085, 752),
  row("25_05", 53543, 7198, 323, 16500, 7198, 576, 8267, 10349, 2667, 465),
  row("25_07", 51560, 7198, 323, 16500, 7310, 576, 7929, 9940, 1523, 261),
  row("25_13", 52859, 10738, 203, 16500, 7064, 579, 6545, 8476, 1897, 857),
  row("25_21", 57386, 0, 200, 16500, 7087, 580, 6520, 9262, 16611, 626),
  row("25_25", 54506, 0, 3250, 16500, 7110, 581, 6715, 10164, 10125, 61),
  row("25_31", 60493, 0, 200, 16500, 7315, 585, 6996, 11640, 15768, 1489),
  row("25_37", 59755, 0, 200, 15960, 7452, 587, 7378, 12561, 15252, 365),
  row("26_03", 64866, 22252, 575, 14200, 7911, 563, 0, 14611, 4717, 37),
  row("26_19", 53646, 7771, 200, 18695, 8161, 568, 0, 15511, 2735, 5),
  row("26_21", 59385, 8571, 200, 18695, 8258, 569, 0, 16379, 6713, 0),
]

async function main() {
  for (const item of rows) {
    const { expectedTotal, ...data } = item
    const total = sumComponents(data)

    if (total !== expectedTotal) {
      throw new Error(`${data.weekKey} total mismatch: expected ${expectedTotal}, got ${total}`)
    }

    const { year, week } = parseWeekKey(data.weekKey)

    await prisma.wealthSnapshot.upsert({
      where: { weekKey: data.weekKey },
      create: {
        ...data,
        currency: "CHF",
        total,
        year,
        week,
      },
      update: {
        ...data,
        currency: "CHF",
        total,
        year,
        week,
      },
    })
  }

  const count = await prisma.wealthSnapshot.count()
  const week2436 = await prisma.wealthSnapshot.findUnique({
    where: { weekKey: "24_36" },
  })

  console.log(`Seeded ${count} wealth snapshots.`)
  console.log(`24_36 total: ${week2436?.total.toString()}`)
}

function row(
  weekKey: string,
  expectedTotal: number,
  savings: number,
  cashReserve: number,
  investments: number,
  mintos: number,
  bondora: number,
  legacyDegiro: number,
  alpaca: number,
  bankAccount: number,
  card: number
): SeedRow {
  return {
    weekKey,
    expectedTotal,
    savings,
    cashReserve,
    investments,
    mintos,
    bondora,
    legacyDegiro,
    alpaca,
    bankAccount,
    card,
  }
}

function parseWeekKey(weekKey: string) {
  const match = /^(\d{2})_(\d{2})$/.exec(weekKey)
  if (!match) {
    throw new Error(`Invalid week key: ${weekKey}`)
  }
  return {
    year: 2000 + Number(match[1]),
    week: Number(match[2]),
  }
}

function sumComponents(data: Omit<SeedRow, "expectedTotal">) {
  return [
    data.savings,
    data.cashReserve,
    data.investments,
    data.mintos,
    data.bondora,
    data.legacyDegiro,
    data.alpaca,
    data.bankAccount,
    data.card,
  ].reduce((sum, value) => sum + value, 0)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
