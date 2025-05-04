const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phoneNumber: { type: String }, // Removed unique index
  gender: { type: String, enum: ['Male', 'Female', 'Other']},
  city: { type: String },
  role: { type: String, enum: ['CUSTOMER', 'AGENT', 'ADMIN'], default: 'CUSTOMER' },
  otp: { type: String },
  profileImage: {type:String},
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false }

}, { timestamps: true });


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);