import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  port: String,
  time: Date,
  message: String,
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
