const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateOTP = () =>  crypto.randomInt(100000, 999999).toString();
console.log("OTP generated: ", generateOTP());
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
      from: `"VehiSafe Insurance" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
              <h2 style="color:rgb(131, 54, 154); text-align: center;">Your OTP Code</h2>
              <p style="font-size: 16px; color: #333;">Hello,</p>
              <p style="font-size: 16px; color: #333;">Your OTP code is:</p>
              <div style="text-align: center; margin: 20px 0; padding: 10px; background-color: #e0f7fa; border-radius: 5px;">
                  <span style="font-size: 24px; font-weight: bold; color:rgb(131, 54, 154);">${otp}</span>
              </div>
              <p style="font-size: 16px; color: #333;">It is valid for 5 minutes.</p>
              <p style="font-size: 16px; color: #333;">If you did not request this code, please ignore this email.</p>
           
              <div style="text-align: center; margin-top: 20px;">
                  <a href="https://yourwebsite.com" style="font-size: 16px; color:rgb(131, 54, 154); text-decoration: none;">Visit our website</a>
              </div>
          </div>`
    };
    await transporter.sendMail(mailOptions);
  };

module.exports = { generateOTP, sendOTPEmail };