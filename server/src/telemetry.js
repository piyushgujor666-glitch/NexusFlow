/**
 * Normalize a sensor reading before storing it in MongoDB's time-series collection.
 * Reject malformed timestamps and out-of-range dates instead of silently replacing them.
 */
export function normalizeReading(raw, now = () => new Date()) {
  if (typeof raw?.sensor !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(raw.sensor)) {
    throw new Error('Reading needs a valid sensor ID');
  }
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) {
    throw new Error('Reading needs a finite numeric value');
  }
  let timestamp;
  if (raw.timestamp === undefined || raw.timestamp === null) {
    timestamp = now();
  } else if (typeof raw.timestamp === 'string' && raw.timestamp.trim() !== '') {
    timestamp = new Date(raw.timestamp);
  } else {
    throw new Error('Timestamp must be a nonempty ISO date string');
  }
  if (!(timestamp instanceof Date) || !Number.isFinite(timestamp.getTime())) {
    throw new Error('Invalid timestamp');
  }
  return { metadata: { sensor: raw.sensor }, value: raw.value, timestamp };
}

export function normalizeBatch(readings, now) {
  if (!Array.isArray(readings) || readings.length < 1 || readings.length > 5000) {
    throw new Error('Provide 1–5000 readings');
  }
  return readings.map(reading => normalizeReading(reading, now));
}
