import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName:     { type: String, trim: true },
  lastName:      { type: String, trim: true },
  email:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  username:      { type: String, required: true, unique: true, trim: true },
  password:      { type: String, required: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil:     { type: Date }
}, { timestamps: true });

userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

export default mongoose.models.User || mongoose.model('User', userSchema);
