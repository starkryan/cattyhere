import connectDB from "@/lib/db"
import Message from '@/models/Message';

export const config = {
  api: {
    bodyParser: {
      type: '*/*', // Accept any content type
    },
  },
};

export async function POST(req) {
  try {
    let raw = await req.text(); // Instead of 'on data', use await req.text()

    await connectDB();

    console.log('\n📦 Raw incoming body:\n' + raw + '\n');

    const sender = raw.match(/Sender:\s*(.*)/)?.[1]?.trim() || 'Unknown';
    const receiverLine = raw.match(/Receiver:\s*(.*)/)?.[1]?.trim() || '';
    const port = receiverLine.match(/"([^"]+)"/)?.[1] || 'Unknown';
    let receiver = receiverLine.replace(/"[^"]+"\s*/, '') || 'Unknown';
    
    // Normalize receiver number - remove '91' prefix if it's a 12-digit number (91 + 10 digit number)
    // Important: Don't modify 10-digit numbers that happen to start with 91 (like 9156789012)
    const receiverStr = receiver.toString();
    const originalReceiver = receiver;
    if (receiverStr.length === 12 && receiverStr.startsWith('91')) {
      receiver = receiverStr.substring(2);
      console.log(`📞 Normalized receiver: ${originalReceiver} -> ${receiver} (removed 91 prefix from 12-digit number)`);
    } else {
      console.log(`📞 Receiver unchanged: ${receiver} (length: ${receiverStr.length})`);
    }

    const scts = raw.match(/SCTS:\s*(\d+)/)?.[1] || '';
    const time = scts
      ? new Date(
          `20${scts.slice(0, 2)}-${scts.slice(2, 4)}-${scts.slice(4, 6)}T${scts.slice(6, 8)}:${scts.slice(8, 10)}:${scts.slice(10, 12)}`
        )
      : new Date();

const message2 =raw
  .split("\n")
  .map(l => l.trim())
  .filter(l => l && !l.startsWith("Sender:") && !l.startsWith("Receiver:") && !l.startsWith("SCTS:") && !l.startsWith("SMSC:") && !l.startsWith("Slot:"))
  .join(" ");

// Step 2: Clean extra spaces
const message = message2.replace(/\s+/g, " ").trim();

await Message.create({
  sender,
  receiver,
  port,
  time,
  message,
});


    console.log('----------------------------------');
    console.log(`🟢 Port    : ${port}`);
    console.log(`📨 Sender  : ${sender}`);
    console.log(`📥 Receiver: ${receiver}`);
    console.log(`🕰️  Time    : ${time.toISOString()}`);
    console.log(`💬 Message : ${message}`);
    console.log('----------------------------------');

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Failed to parse SMS:', err.message);
    return new Response(JSON.stringify({ error: 'Parse error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
