import connectDB from "@/lib/db";
import Message from "@/models/Message";

export const config = {
  api: {
    bodyParser: true, // Accept JSON input
  },
};

export async function POST(req) {
  try {
    const body = await req.json();

    await connectDB();

    let {
      sender,
      recipient,
      message,
      timestamp,
      receivedAt,
      slotIndex,
      carrierName,
      slotInfo,
    } = body;

    // ✅ Normalize phone numbers to 10 digits
    const normalizeNumber = (num) => {
      if (!num) return "Unknown";
      const digits = num.replace(/\D/g, ""); // Remove non-digits
      return digits.length > 10 ? digits.slice(-10) : digits; // Keep last 10 digits
    };

    sender = normalizeNumber(sender);
    recipient = normalizeNumber(recipient);

    // Save to MongoDB
    await Message.create({
      sender,
      receiver: recipient,
      port: slotInfo?.phoneNumber
        ? normalizeNumber(slotInfo.phoneNumber)
        : "Unknown",
      time: new Date(receivedAt || timestamp || Date.now()),
      message: message || "",
    });

    console.log("✅ SMS Saved:", {
      sender,
      recipient,
      message,
      receivedAt,
    });

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error saving SMS:", err);
    return new Response(JSON.stringify({ error: "Failed to save SMS" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
