import { db } from "@/db";
import {
  users, mines, productionRecords, dispatchRecords,
  inventoryRecords, demandRecords, notifications,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

const COAL_GRADES = ["G5", "G6", "G7", "G8", "G9", "G10"] as const;
const SECTORS = ["Power", "Steel", "Cement", "Railways", "Others"] as const;
const SHIFTS = ["A", "B", "C"] as const;

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDatabase() {
  // Check if already seeded
  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length > 0) return { seeded: false, message: "Database already seeded" };

  // Create users
  const adminHash = await hashPassword("admin123");
  const analystHash = await hashPassword("analyst123");
  const managerHash = await hashPassword("manager123");
  const operatorHash = await hashPassword("operator123");

  const insertedUsers = await db.insert(users).values([
    { email: "admin@coalsense.ai", passwordHash: adminHash, name: "Rajesh Kumar", role: "admin" as const },
    { email: "analyst@coalsense.ai", passwordHash: analystHash, name: "Priya Sharma", role: "analyst" as const },
    { email: "manager@coalsense.ai", passwordHash: managerHash, name: "Anil Verma", role: "manager" as const },
    { email: "operator@coalsense.ai", passwordHash: operatorHash, name: "Suresh Yadav", role: "operator" as const },
  ]).returning();

  // Create mines
  const insertedMines = await db.insert(mines).values([
    { name: "Piparwar OCP", location: "Chatra, Jharkhand", capacity: 15 },
    { name: "Ashoka OCP", location: "Chatra, Jharkhand", capacity: 12 },
    { name: "Magadh OCP", location: "Aurangabad, Bihar", capacity: 18 },
    { name: "Amrapali OCP", location: "Chatra, Jharkhand", capacity: 20 },
    { name: "Rajrappa OCP", location: "Ramgarh, Jharkhand", capacity: 10 },
    { name: "NK Area", location: "Hazaribagh, Jharkhand", capacity: 8 },
  ]).returning();

  const mineIds = insertedMines.map((m) => m.id);
  const adminId = insertedUsers[0].id;

  // Generate 24 months of historical data (2023-01 to 2024-12)
  const productionValues = [];
  const dispatchValues = [];
  const inventoryValues = [];
  const demandValues = [];

  for (let monthOffset = 0; monthOffset < 24; monthOffset++) {
    const year = 2023 + Math.floor(monthOffset / 12);
    const month = (monthOffset % 12) + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-15`;

    // Seasonal pattern: higher demand in winter (Oct-Feb), lower in monsoon (Jul-Sep)
    let seasonalFactor = 1.0;
    if (month >= 10 || month <= 2) seasonalFactor = 1.15 + Math.random() * 0.1;
    else if (month >= 7 && month <= 9) seasonalFactor = 0.82 + Math.random() * 0.08;
    else seasonalFactor = 0.95 + Math.random() * 0.1;

    // Trend: gradual increase over time
    const trendFactor = 1 + monthOffset * 0.008;

    for (const mineId of mineIds) {
      const mineCapacity = insertedMines.find((m) => m.id === mineId)!.capacity!;

      for (const grade of COAL_GRADES) {
        const baseProduction = (mineCapacity / COAL_GRADES.length) * rand(0.7, 1.1);
        const production = baseProduction * seasonalFactor * trendFactor;

        for (const shift of SHIFTS) {
          productionValues.push({
            mineId,
            date: dateStr,
            coalGrade: grade,
            quantity: Math.round(production / 3 * rand(0.85, 1.15) * 100) / 100,
            shift,
            productionCost: rand(800, 1500),
            createdBy: adminId,
          });
        }

        // Dispatch (slightly less than production)
        const dispatchQty = production * rand(0.85, 0.98);
        dispatchValues.push({
          mineId,
          date: dateStr,
          coalGrade: grade,
          quantity: Math.round(dispatchQty * 100) / 100,
          sector: pickRandom(SECTORS),
          destination: pickRandom(["NTPC Kahalgaon", "Tata Steel Jamshedpur", "ACC Cement", "Indian Railways", "JSW Steel"]),
          createdBy: adminId,
        });
      }

      // Inventory per mine
      for (const grade of COAL_GRADES) {
        const opening = rand(0.3, 2.5);
        const closing = opening + rand(-0.5, 0.8);
        inventoryValues.push({
          mineId,
          date: dateStr,
          coalGrade: grade,
          openingStock: opening,
          closingStock: Math.max(0.05, closing),
          createdBy: adminId,
        });
      }
    }

    // Overall demand records
    for (const grade of COAL_GRADES) {
      const baseDemand = rand(8, 18);
      const demand = baseDemand * seasonalFactor * trendFactor;

      for (const sector of SECTORS) {
        const sectorWeight = sector === "Power" ? 0.62 :
          sector === "Steel" ? 0.18 :
          sector === "Cement" ? 0.12 :
          sector === "Railways" ? 0.05 : 0.03;

        demandValues.push({
          date: dateStr,
          coalGrade: grade,
          sector,
          quantity: Math.round(demand * sectorWeight * 100) / 100,
          createdBy: adminId,
        });
      }
    }
  }

  // Batch insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < productionValues.length; i += chunkSize) {
    await db.insert(productionRecords).values(productionValues.slice(i, i + chunkSize));
  }
  for (let i = 0; i < dispatchValues.length; i += chunkSize) {
    await db.insert(dispatchRecords).values(dispatchValues.slice(i, i + chunkSize));
  }
  for (let i = 0; i < inventoryValues.length; i += chunkSize) {
    await db.insert(inventoryRecords).values(inventoryValues.slice(i, i + chunkSize));
  }
  for (let i = 0; i < demandValues.length; i += chunkSize) {
    await db.insert(demandRecords).values(demandValues.slice(i, i + chunkSize));
  }

  // Add some notifications
  for (const user of insertedUsers) {
    await db.insert(notifications).values([
      {
        userId: user.id,
        type: "system",
        title: "Welcome to CoalSense AI",
        message: "Your account has been set up. Start exploring the dashboard for demand forecasting and production planning insights.",
      },
      {
        userId: user.id,
        type: "demand_alert",
        title: "Q4 Demand Surge Expected",
        message: "Historical patterns indicate a 15-20% increase in coal demand during October-February. Plan production capacity accordingly.",
      },
      {
        userId: user.id,
        type: "inventory_alert",
        title: "G6 Grade Inventory Below Safety Stock",
        message: "Current G6 inventory at Piparwar OCP is projected to fall below the defined safety-stock level by next month.",
      },
    ]);
  }

  return {
    seeded: true,
    message: `Seeded: ${insertedUsers.length} users, ${insertedMines.length} mines, ${productionValues.length} production records, ${dispatchValues.length} dispatch records, ${inventoryValues.length} inventory records, ${demandValues.length} demand records`,
  };
}
