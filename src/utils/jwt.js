import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

export const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};

export const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

export const setRefreshCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('jid', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth/refresh',
    maxAge: parseDurationMs(REFRESH_EXPIRES)
  });
};

function parseDurationMs(str) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(str);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const map = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * map[unit];
}
