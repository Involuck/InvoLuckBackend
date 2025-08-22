import User from '../../models/user.js';
import crypto from 'crypto';
import { 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken, 
  setRefreshCookie 
} from '../../utils/jwt.js';
import sendEmail from '../../utils/sendEmail.js';

// Helper: standardize auth response
const sendAuthResponse = (res, user, accessToken, status = 200) => {
  return res.status(status).json({
    message: status === 201 ? 'User registered successfully' : 'Login successful',
    user: { id: user._id, name: user.name, email: user.email },
    token: accessToken,
  });
};

// POST /api/auth/signup //
export const signup = async (req, res, next) => {
  try { 
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });
    const access = signAccessToken(user._id);
    const refresh = signRefreshToken(user._id);

    if (user.setRefreshToken) await user.setRefreshToken(refresh);
    setRefreshCookie(res, refresh);

    return sendAuthResponse(res, user, access, 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password +refreshTokenHash');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const access = signAccessToken(user._id);
    const refresh = signRefreshToken(user._id);

    if (user.setRefreshToken) await user.setRefreshToken(refresh);
    setRefreshCookie(res, refresh);

    return sendAuthResponse(res, user, access);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('jid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth/refresh',
    });
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.jid;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id).select('+refreshTokenHash');
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.verifyRefreshToken && !(await user.verifyRefreshToken(token))) {
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    const newRefresh = signRefreshToken(user._id);
    if (user.setRefreshToken) await user.setRefreshToken(newRefresh);
    setRefreshCookie(res, newRefresh);

    const access = signAccessToken(user._id);
    return res.json({ token: access });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshTokenHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `
      <h2>Password Reset Request</h2>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail(user.email, "Password Reset Request", message);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
};
