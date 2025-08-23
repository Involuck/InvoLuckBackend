import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshTokenHash: { type: String, select: false }, // store hashed refresh token
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.setRefreshToken = async function (rawToken) {
  const salt = await bcrypt.genSalt(10);
  this.refreshTokenHash = await bcrypt.hash(rawToken, salt);
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.verifyRefreshToken = async function (rawToken) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(rawToken, this.refreshTokenHash);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token valid for 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // send plain token in email
};

const User = mongoose.model("User", userSchema);

export default User; 