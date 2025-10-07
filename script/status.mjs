import mongoose from "mongoose";
import fetch from "node-fetch";
import cron from "node-cron";
import Numbers from "../models/Numbers.js";
import Country from "../models/Countires.js";
import Panel from "../models/Panel.js";

// 🔗 MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://manager:Aman4242434@69.62.73.7:27017/manager?authSource=manager&retryWrites=true&w=majority&appName=Cluster0";

await mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 🧠 Ensure "India" exists
async function getIndiaId() {
  let country = await Country.findOne({ name: "india" });
  if (!country) {
    country = await Country.create({ name: "india" });
    console.log("🆕 Country 'India' created in DB");
  }
  return country._id;
}

// ⚙️ Fetch panel data (safe + timeout)
async function fetchPanelData(panel) {
  if (!panel.url) {
    console.warn(`⚠️ Panel ${panel.code} has no URL`);
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // ⏳ 10s timeout

  try {
    const res = await fetch(panel.url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`⚠️ [${panel.code}] Bad response: ${res.status}`);
      return [];
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.status) {
      console.warn(`⚠️ [${panel.code}] Invalid JSON format`);
      return [];
    }

    return data.status.map((p) => ({
      panelCode: panel.code,
      inserted: p.inserted,
      sn: p.sn,
      port: p.port,
      iccid: p.iccid,
      imsi: p.imsi,
      opr: p.opr,
      sig: p.sig,
      active: p.active,
      st: p.st,
    }));
  } catch (err) {
    if (err.name === "AbortError") {
      console.warn(`⏰ [${panel.code}] Timed out - skipping`);
    } else {
      console.error(`❌ [${panel.code}] Fetch error:`, err.message);
    }
    return [];
  }
}

// 🚀 Main sync logic
async function syncAllGateways() {
  try {
    const indiaId = await getIndiaId();
    const panels = await Panel.find();
    if (!panels.length) {
      console.warn("⚠️ No panels found in database!");
      return;
    }

    console.log(`🌍 Found ${panels.length} panels. Loading data...`);

    // 1️⃣ Fetch all panels in parallel
    const allPorts = (await Promise.all(panels.map(fetchPanelData))).flat();

    // 2️⃣ Filter valid numbers
    const validPorts = allPorts.filter((p) => p.inserted === 1 && p.sn);

    if (!validPorts.length) {
      console.log("⚠️ No valid numbers found in any panel response.");
      return;
    }

    // 3️⃣ Prepare bulk updates
    const bulkOps = [];
    const activeNumbers = new Set();

    for (const p of validPorts) {
      const isActive = p.st === 3 || p.st === 7;
      const snStr = String(p.sn);
      const processedNumber =
        snStr.length === 12 && snStr.startsWith("91")
          ? parseInt(snStr.substring(2))
          : parseInt(snStr);

      activeNumbers.add(processedNumber);

      const numberData = {
        countryid: indiaId,
        port: p.port,
        iccid: p.iccid || null,
        imsi: p.imsi || null,
        operator: p.opr || null,
        signal: isActive ? p.sig || 0 : 0,
        locked: p.active === 0,
        lastRotation: new Date(),
        active: isActive,
      };

      bulkOps.push({
        updateOne: {
          filter: { number: processedNumber },
          update: { $set: numberData },
          upsert: true,
        },
      });
    }

    // 4️⃣ Execute bulk write
    const result = await Numbers.bulkWrite(bulkOps);
    console.log(
      `✅ Bulk upsert complete: ${result.modifiedCount} updated, ${result.upsertedCount} inserted`
    );

    // 5️⃣ Mark numbers not found as inactive
    const resultInactive = await Numbers.updateMany(
      { number: { $nin: [...activeNumbers] } },
      { $set: { active: false, signal: 0 } }
    );

    console.log(`🔒 Marked ${resultInactive.modifiedCount} numbers as inactive`);
    console.log(`[${new Date().toISOString()}] ✅ Sync complete`);
  } catch (err) {
    console.error("❌ Error syncing all gateways:", err.message);
  }
}

// 🕒 Run every 30 seconds
cron.schedule("*/30 * * * * *", () => {
  syncAllGateways();
});
