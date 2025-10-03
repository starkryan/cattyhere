import mongoose from "mongoose";
import Orders from "../models/Orders.js";
import Message from "../models/Message.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://manager:Aman4242434@69.62.73.7:27017/manager?authSource=manager&retryWrites=true&w=majority&appName=Cluster0";

// Escape regex special chars
const escapeRegex = (s = "") =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper function to handle both old and new number formats
function getPhoneNumbers(order) {
  const orderNumberStr = order.number.toString();
  let fullNumber, numberWithCountry;
  
  if (order.dialcode === 91 && orderNumberStr.length === 10) {
    // New format: 10-digit number + 91 dialcode
    numberWithCountry = `91${orderNumberStr}`;
    fullNumber = `+${numberWithCountry}`;
  } else if (order.dialcode === 91 && orderNumberStr.length === 12 && orderNumberStr.startsWith('91')) {
    // Old format: 12-digit number already includes 91
    numberWithCountry = orderNumberStr;
    fullNumber = `+${orderNumberStr}`;
  } else {
    // Other countries or formats
    numberWithCountry = `${order.dialcode}${orderNumberStr}`;
    fullNumber = `+${numberWithCountry}`;
  }
  
  return { fullNumber, numberWithCountry, orderNumberStr };
}

// Simulate message search with both formats
function simulateMessageSearch(order, testMessages) {
  const { fullNumber, numberWithCountry, orderNumberStr } = getPhoneNumbers(order);
  
  const escapedFullNumber = escapeRegex(fullNumber);
  const escapedNumberOnly = escapeRegex(orderNumberStr);
  const escapedNumberWithCountry = escapeRegex(numberWithCountry);

  console.log(`\n🔍 Testing order: ${order._id}`);
  console.log(`   Order number: ${orderNumberStr}`);
  console.log(`   Full number: ${fullNumber}`);
  console.log(`   Number with country: ${numberWithCountry}`);
  
  const matchedMessages = [];
  
  for (const msg of testMessages) {
    const searchConditions = [
      { receiver: fullNumber },
      { receiver: orderNumberStr },
      { message: new RegExp(escapedFullNumber, "i") },
      { message: new RegExp(escapedNumberOnly, "i") },
      { message: new RegExp(escapedNumberWithCountry, "i") },
    ];
    
    const isMatch = searchConditions.some(condition => {
      if (condition.receiver) {
        return msg.receiver === condition.receiver || msg.message.includes(condition.receiver);
      } else if (condition.regexp) {
        return condition.regexp.test(msg.message);
      }
      return false;
    });
    
    if (isMatch) {
      matchedMessages.push(msg);
      console.log(`   ✅ Matched: "${msg.message}" (receiver: ${msg.receiver})`);
    }
  }
  
  console.log(`   📊 Total matched: ${matchedMessages.length}/${testMessages.length}`);
  return matchedMessages;
}

async function runSimulation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Get some sample orders
    const orders = await Orders.find({ active: true }).limit(3);
    console.log(`📦 Found ${orders.length} active orders for testing`);

    if (orders.length === 0) {
      console.log("❌ No active orders found for testing");
      return;
    }

    // Create test messages with different formats
    const testMessages = [
      {
        sender: "TEST-1",
        receiver: "+91953927130",  // New format with +
        message: "Your OTP is 123456 for +91953927130",
        time: new Date()
      },
      {
        sender: "TEST-2", 
        receiver: "91953927130",   // New format without +
        message: "OTP for 91953927130 is 789012",
        time: new Date()
      },
      {
        sender: "TEST-3",
        receiver: "+919547067914", // Old format with +
        message: "Your verification code is 345678 for +919547067914",
        time: new Date()
      },
      {
        sender: "TEST-4",
        receiver: "919547067914",  // Old format without +
        message: "Code 919547067914 is 901234",
        time: new Date()
      },
      {
        sender: "TEST-5",
        receiver: "953927130",    // 10-digit only
        message: "Your OTP 654321 for 953927130",
        time: new Date()
      },
      {
        sender: "TEST-6",
        receiver: "+91953927130",  // International format
        message: "Welcome! Your number +91953927130 has been registered",
        time: new Date()
      }
    ];

    console.log("\n🧪 Starting Message Processing Simulation");
    console.log("=" .repeat(60));

    let totalMatches = 0;
    
    for (const order of orders) {
      const matches = simulateMessageSearch(order, testMessages);
      totalMatches += matches.length;
    }

    console.log("\n" + "=" .repeat(60));
    console.log(`📈 Simulation Results:`);
    console.log(`   Total orders tested: ${orders.length}`);
    console.log(`   Total test messages: ${testMessages.length}`);
    console.log(`   Total matches found: ${totalMatches}`);
    console.log(`   Average matches per order: ${(totalMatches / orders.length).toFixed(2)}`);
    
    console.log("\n✅ Simulation completed successfully!");

  } catch (error) {
    console.error("❌ Simulation error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

// Run the simulation
runSimulation();
