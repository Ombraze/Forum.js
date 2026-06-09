import jwt from 'jsonwebtoken';

const EXPIRES_IN = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET manquant — copiez .env.example vers .env');
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    getSecret(),
    { expiresIn: EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
