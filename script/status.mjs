import mongoose from "mongoose";
import fetch from "node-fetch";
import cron from "node-cron";
import Numbers from "../models/Numbers.js";
import Country from "../models/Countires.js";
import Panel from "../models/Panel.js"; // Panel schema

// 🔗 MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://manager:Aman4242434@69.62.73.7:27017/manager?authSource=manager&retryWrites=true&w=majority&appName=Cluster0";
await mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 🔎 Ensure "India" exists in Country collection
async function getIndiaId() {
  let country = await Country.findOne({ name: "india" });
  if (!country) {
    country = await Country.create({ name: "india" });
    console.log("🆕 Country 'India' created in DB");
  }
  return country._id;
}

// 🚀 Sync function
async function syncGatewayStatus() {
  try {
    // 📌 Fetch Panel URL from DB
    const panel = await Panel.findOne({ code: 1 });
    if (!panel || !panel.url) {
      console.error("❌ No panel URL found in DB (code:1)");
      return;
    }

    const GATEWAY_URL = panel.url;
    console.log(`🌐 Using Gateway URL: ${GATEWAY_URL}`);

    const res = await fetch(GATEWAY_URL);
    const data = await res.json();

    const ports = data.status;
    const indiaId = await getIndiaId();

    // Collect all numbers returned by the API
    const apiNumbers = ports.filter(p => p.inserted === 1 && p.sn).map(p => p.sn);

    for (const p of ports) {
      if (p.inserted === 1 && p.sn) {
        const isActive = p.st === 3 || p.st === 7;
        
        // Remove '91' prefix if present, keep only 10 digits
        const processedNumber = p.sn.toString().startsWith('91') ? 
          parseInt(p.sn.toString().substring(2)) : 
          parseInt(p.sn.toString());

        // Check if number exists first
        const existingNumber = await Numbers.findOne({ number: processedNumber });
        
        if (existingNumber) {
          // Update existing number
          await Numbers.updateOne(
            { _id: existingNumber._id },
            {
              $set: {
                countryid: indiaId,
                port: p.port,
                iccid: p.iccid || null,
                imsi: p.imsi || null,
                operator: p.opr || null,
                signal: isActive ? p.sig || 0 : 0,
                locked: p.active === 0,
                lastRotation: new Date(),
                active: isActive,
              },
            }
          );
          console.log(`🔄 Updated number: ${processedNumber} (Port ${p.port}) - Active: ${isActive}`);
        } else {
          // Create new number
          await Numbers.create({
            number: processedNumber,
            countryid: indiaId,
            port: p.port,
            iccid: p.iccid || null,
            imsi: p.imsi || null,
            operator: p.opr || null,
            signal: isActive ? p.sig || 0 : 0,
            locked: p.active === 0,
            lastRotation: new Date(),
            active: isActive,
          });
          console.log(`🆕 Added new number: ${processedNumber} (Port ${p.port}) - Active: ${isActive}`);
        }
      }
    }

    // ⚠️ Mark numbers not in API response as inactive
    // Process apiNumbers to remove '91' prefix for consistent matching
    const processedApiNumbers = apiNumbers.map(num => 
      num.toString().startsWith('91') ? 
      parseInt(num.toString().substring(2)) : 
      parseInt(num.toString())
    );
    
    const result = await Numbers.updateMany(
      { number: { $nin: processedApiNumbers } },
      { $set: { active: false, signal: 0 } }
    );
    console.log(`🔒 Marked ${result.modifiedCount} numbers as inactive`);

    console.log(`[${new Date().toISOString()}] ✅ Synced ${ports.length} ports`);
  } catch (err) {
    console.error("❌ Error syncing:", err.message);
  }
}


// 🕒 Run every 30 seconds
cron.schedule("*/30 * * * * *", () => {
  syncGatewayStatus();
});
