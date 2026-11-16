import { Schema, model } from 'mongoose';

// Define the User schema
const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true, trim: true },
});

export const User = model('User', userSchema);
