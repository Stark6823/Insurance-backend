const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../services/otp.service');




exports.registerUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please verify OTP first' 
      });
    }

   
    Object.assign(user, req.body);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Registration complete', 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        city: user.city,
      }
    });
    await getRegisterMailTemplate(email); 
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return user data (without password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    console.log('Update request received:', req.body); // Log incoming data
    console.log('Files:', req.file); // Check if file exists

    const { id } = req.params;
    let updates = req.body;

    // Handle file upload
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
      console.log('New profile image path:', updates.profileImage);
    }

    // Remove restricted fields
    ['_id', 'email', 'role', 'password'].forEach(field => delete updates[field]);

    console.log('Final updates:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('User not found with ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('User updated successfully:', updatedUser);
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Full update error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await User.findOneAndUpdate(
      { email },
      { otp, otpExpiry, isVerified: false },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.isVerified = true; 
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Server error during OTP verification:', err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

exports.updatePassword =  async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Find user and verify OTP status
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'OTP not verified' });
    }

    // Update password
    user.password = newPassword;
    user.isVerified = false; 
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
}



function getRegisterMailTemplate(email) {
 
  return transporter.sendMail({
    from:`"Insure LTD" <${process.env.EMAIL_USER}>`,
    to:email,
    subject:'Thanks For Registration',
    html:`
  <!DOCTYPE html><html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><title></title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;400;700;900&amp;display=swap" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&amp;display=swap" rel="stylesheet" type="text/css"><!--<![endif]--><style> *{box-sizing:border-box}body{margin:0;padding:0}a[x-apple-data-detectors]{color:inherit !important;text-decoration:inherit !important}#MessageViewBody a{color:inherit;text-decoration:none}p{line-height:inherit}.desktop_hide,.desktop_hide table{mso-hide:all;display:none;max-height:0;overflow:hidden}.image_block img+div{display:none}@media (max-width:720px){.social_block.desktop_hide .social-table{display:inline-block !important}.mobile_hide{display:none}.row-content{width:100% !important}.stack .column{width:100%;display:block}.mobile_hide{min-height:0;max-height:0;max-width:0;overflow:hidden;font-size:0}.desktop_hide,.desktop_hide table{display:table !important;max-height:none !important}.row-2 .column-1 .block-1.text_block td.pad,.row-2 .column-1 .block-2.text_block td.pad{padding:10px 5px 5px !important}.row-3 .column-1 .block-1.spacer_block{height:20px !important}}</style></head><body style="background-color:#fff;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#7700bd;background-size:auto"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-size:auto;border-radius:0;color:#000;width:700px;margin:0 auto" width="700"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:30px;padding-top:30px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="text_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad"><div style="font-family:Arial,sans-serif"><div class
  style="font-size:12px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;mso-line-height-alt:14.399999999999999px;color:#fff;line-height:1.2"><p
  style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:30px;"><strong>Welcome
                                                                                      to Insure!</strong></span></p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:700px;margin:0 auto" width="700"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:25px;padding-top:25px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:15px;padding-left:5px;padding-right:5px;padding-top:20px"><div
  style="font-family:'Trebuchet MS',Tahoma,sans-serif"><div class
  style="font-size:14px;font-family:Montserrat,'Trebuchet MS','Lucida Grande','Lucida Sans Unicode','Lucida Sans',Tahoma,sans-serif;mso-line-height-alt:16.8px;color:#8400d1;line-height:1.2"><p
  style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span
  style="font-size:30px;"><strong></strong></span></p></div></div></td></tr></table><table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:10px"><div style="font-family:Arial,sans-serif"><div class
  style="font-size:12px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;mso-line-height-alt:14.399999999999999px;color:#555;line-height:1.2"><p
  style="margin:0;font-size:12px;text-align:center;mso-line-height-alt:14.399999999999999px"><span style="font-size:15px;">You have
                                                                                  successfully registered, </span></p><p
  style="margin:0;font-size:12px;text-align:center;mso-line-height-alt:14.399999999999999px"><span style="font-size:15px;">and you are
                                                                                  now one of the Insure
                                                                                  family!</span></p></div></div></td></tr></table><div class="spacer_block block-3" style="height:60px;line-height:60px;font-size:1px">&#8202;</div><table class="text_block block-5" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad"><div style="font-family:Arial,sans-serif"><div class
  style="font-size:12px;font-family:'Open Sans','Helvetica Neue',Helvetica,Arial,sans-serif;mso-line-height-alt:14.399999999999999px;color:#171717;line-height:1.2"><p
  style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:12px;"><strong>Our
                                                                                      mailing address:</strong></span></p><p
  style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span
  style="font-size:12px;">insureforone@gmail.com</span></p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#7500ba"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;color:#000;width:700px;margin:0 auto" width="700"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;padding-bottom:25px;padding-top:25px;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><div class="spacer_block block-1" style="height:60px;line-height:60px;font-size:1px">&#8202;</div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>`
  });
}