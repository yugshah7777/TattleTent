import { Router } from 'express';
import pool from '../db/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import passport from 'passport';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { EMAIL_BRAND_NAME, getEmailFooter } from '../utils/email.config.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = Router();

const generateNumericOtp = () => crypto.randomInt(100000, 1000000).toString();

const randomChar = (charset) => charset[crypto.randomInt(0, charset.length)];

const generateTemporaryPassword = (length = 14) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const all = upper + lower + digits + symbols;

  const chars = [
    randomChar(upper),
    randomChar(lower),
    randomChar(digits),
    randomChar(symbols),
  ];

  for (let i = chars.length; i < length; i += 1) {
    chars.push(randomChar(all));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

// otp
const otpStore = new Map();
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE email = $1 AND is_verified = TRUE', [email]);
    if (user.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const otp = generateNumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // 5 mins
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    otpStore.set(email, { otpHash, expiresAt });

    await sendEmail({
      email: email,
      subject: `Your Verification Code — ${EMAIL_BRAND_NAME}`,
      html: `<h2>Email Verification</h2><p>Your ${EMAIL_BRAND_NAME} verification code is:</p><h3>${otp}</h3><p>This code expires in 5 minutes.</p><p>If you did not request this action, you may ignore this email.</p>${getEmailFooter()}`,
    });

    res.status(200).json({ message: 'OTP has been sent to your email.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    const { otpHash, expiresAt } = storedData;

    // Otp Expire
    if (new Date() > new Date(expiresAt)) {
      otpStore.delete(email); // Clean up expired OTP
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isValidOtp = await bcrypt.compare(otp, otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'OTP incorrect. Please try again.' });
    }

    // --- OTP is valid ---
    // User -> DB
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, 'Citizen', TRUE) RETURNING user_id, name, email, role",
      [name, email, passwordHash]
    );

    otpStore.delete(email);
    
    // JWT
    const user = newUser.rows[0];
    const token = generateToken(user.user_id);
    res.status(201).json({ token, user });

  } catch (err) {
    if (err.code === '23505') { 
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/* ----------------------------
   STAFF CREATION BY ADMIN
----------------------------- */

router.post('/admin/create-staff', protect, adminOnly, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    // 1️⃣  Check if user already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];

      if (existingUser.role === "Citizen") {
        // Upgrade citizen to staff
        const updated = await pool.query(
          `UPDATE users
           SET role = 'Staff', is_verified = TRUE, must_change_password = TRUE
           WHERE user_id = $1
           RETURNING user_id, name, email, role, must_change_password`,
          [existingUser.user_id]
        );

        const staff = updated.rows[0];

        await sendEmail({
          email: staff.email,
          subject: `Staff Account Update — ${EMAIL_BRAND_NAME}`,
          html: `
            <h2>Staff Account Update</h2>
            <p>Dear ${staff.name},</p>
            <p>Your account has been upgraded to Staff. Please log in using your existing account credentials.</p>
            <p><b>Login here:</b> https://your-frontend-url.com/login</p>
            ${getEmailFooter()}
          `,
        });

        return res.status(200).json({
          message: 'Existing citizen account upgraded to Staff and notified by email.',
          staff,
        });
      } else {
        // Already Admin/Ringmaster/Groundmaster
        return res.status(409).json({
          message: `User is already ${existingUser.role}. Cannot upgrade.`,
        });
      }
    }
    
    // 2️⃣  Create temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3️⃣  Insert staff into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, must_change_password)
       VALUES ($1, $2, $3, 'Staff', TRUE, TRUE)
       RETURNING user_id, name, email, role, must_change_password`,
      [name, email, hashedPassword]
    );

    const staff = result.rows[0];

    // 4️⃣  Send email to staff with login credentials
    await sendEmail({
      email,
      subject: `Staff Account Created — ${EMAIL_BRAND_NAME}`,
      html: `
        <h2>Staff Account Created</h2>
        <p>Dear ${name},</p>
        <p>An account has been created for you by the administrator. Use the credentials below to log in:</p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Temporary Password:</b> ${tempPassword}</li>
        </ul>
        <p>For security reasons, you must change your password after your first login.</p>
        <p><b>Login here:</b> https://your-frontend-url.com/login</p>
        ${getEmailFooter()}
      `,
    });

    res.status(201).json({
      message: 'Staff account created successfully and credentials emailed.',
      staff,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- LOGIN A USER ---
// Route: POST /api/auth/login

// Login

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields.' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        const user = userResult.rows[0];

        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email address before logging in.' });
        }
        
        if (!user.password_hash) {
            return res.status(401).json({ message: 'Account was created with a social provider. Please use Google to log in.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

         //  Check if must change password
        if (user.must_change_password) {
          return res.status(403).json({
            message: 'Password change required before login.',
            must_change_password: true,
            email: user.email,
            role: user.role,
          });
        }

        // Generate JWT
        const token = generateToken(user.user_id);
        
        // Resirect
        res.status(200).json({ 
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both old and new password.' });
    }

    // Get current user info
    const userResult = await pool.query(
      'SELECT user_id, password_hash, must_change_password FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password + reset must_change_password flag
    const updatedUser = await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE
       WHERE user_id = $2
       RETURNING user_id, name, email, role, must_change_password`,
      [newHash, req.user.user_id]
    );

    res.status(200).json({
      message: 'Password changed successfully.',
      user: updatedUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/complete-required-password-change', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, current password, and new password.' });
    }

    const userResult = await pool.query(
      'SELECT user_id, name, email, role, password_hash, must_change_password FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];

    if (!user.must_change_password) {
      return res.status(400).json({ message: 'Password change is not required for this account.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current credentials are invalid.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE
       WHERE user_id = $2`,
      [newHash, user.user_id]
    );

    return res.status(200).json({
      message: 'Password changed successfully.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Password reset
const resetOtpStore = new Map();

router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await pool.query('SELECT user_id FROM users WHERE email = $1 AND is_verified = TRUE', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'No verified account found with this email.' });
    }

    const otp = generateNumericOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    resetOtpStore.set(email, { otpHash, expiresAt, verified: false });

    await sendEmail({
      email,
      subject: `Password Reset Code — ${EMAIL_BRAND_NAME}`,
      html: `<h2>Password Reset</h2><p>Your ${EMAIL_BRAND_NAME} password reset code is:</p><h3>${otp}</h3><p>This code expires in 5 minutes.</p><p>If you did not request this action, you may ignore this email.</p>${getEmailFooter()}`,
    });

    res.status(200).json({ message: 'Password reset OTP has been sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP.' });
    }

    const storedData = resetOtpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    const { otpHash, expiresAt } = storedData;
    if (new Date() > new Date(expiresAt)) {
      resetOtpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isValidOtp = await bcrypt.compare(otp, otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'OTP incorrect. Please try again.' });
    }

    resetOtpStore.set(email, { ...storedData, verified: true });
    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and new password.' });
    }

    const storedData = resetOtpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    const { otpHash, expiresAt, verified } = storedData;
    if (new Date() > new Date(expiresAt)) {
      resetOtpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (!verified) {
      if (!otp) {
        return res.status(400).json({ message: 'OTP verification is required before resetting password.' });
      }

      const isValidOtp = await bcrypt.compare(otp, otpHash);
      if (!isValidOtp) {
        return res.status(400).json({ message: 'OTP incorrect. Please try again.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updatedUser = await pool.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE, is_verified = TRUE
       WHERE email = $2
       RETURNING user_id, name, email, role`,
      [passwordHash, email]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    resetOtpStore.delete(email);
    return res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});


// OAUTH
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Step 1: Redirect user to Google login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Handle Google callback and redirect to frontend
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/?error=oauth_failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user.user_id);

      const safeUser = {
        user_id: req.user.user_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      };
      const user = encodeURIComponent(JSON.stringify(safeUser));
      const userRole = encodeURIComponent(req.user.role);

      res.redirect(
        `${FRONTEND_URL}/auth-success?token=${token}&role=${userRole}&user=${user}`
      );
    } catch (err) {
      console.error(err);
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed`);
    }
  }
);



// Check if email exists
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
