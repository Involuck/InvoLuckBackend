import User from '../../models/user.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { setRefreshCookie } from '../../utils/cookies.js';

// Helper: standardize auth response
const sendAuthResponse = (res, user, accessToken, status = 200) => {
  return res.status(status).json({
    message: status === 201 ? 'User registered successfully' : 'Login successful',
    user: { id: user._id, name: user.name, email: user.email },
    token: accessToken,
  });
};

// POST /api/auth/signup
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1) validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2) check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // 3) create user (password hashing is in model pre-save hook)
    const user = await User.create({ name, email, password });

    // 4) issue tokens
    const access = signAccessToken(user._id);
    const refresh = signRefreshToken(user._id);

    // 5) store hashed refresh token in DB
    if (user.setRefreshToken) {
      await user.setRefreshToken(refresh);
    }

    // 6) set refresh cookie
    setRefreshCookie(res, refresh);

    // 7) send response
    return sendAuthResponse(res, user, access, 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2) find user
    const user = await User.findOne({ email }).select('+password +refreshTokenHash');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // 3) check password
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // 4) issue tokens
    const access = signAccessToken(user._id);
    const refresh = signRefreshToken(user._id);

    // 5) store hashed refresh token
    if (user.setRefreshToken) {
      await user.setRefreshToken(refresh);
    }

    // 6) set refresh cookie
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
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.jid;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    // verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id).select('+refreshTokenHash');
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.verifyRefreshToken) {
      const ok = await user.verifyRefreshToken(token);
      if (!ok) return res.status(401).json({ message: 'Refresh token revoked' });
    }

    // rotate refresh token
    const newRefresh = signRefreshToken(user._id);
    if (user.setRefreshToken) {
      await user.setRefreshToken(newRefresh);
    }
    setRefreshCookie(res, newRefresh);

    // issue new access token
    const access = signAccessToken(user._id);
    return res.json({ token: access });
  } catch (err) {
    next(err);
  }
};
