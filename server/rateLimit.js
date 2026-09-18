const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function getKey(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function isBlocked(req) {
  const key = getKey(req);
  const entry = attempts.get(key);
  if (!entry) return false;

  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(req) {
  const key = getKey(req);
  const entry = attempts.get(key);

  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }

  entry.count += 1;
}

function reset(req) {
  attempts.delete(getKey(req));
}

module.exports = { isBlocked, registerFailure, reset };