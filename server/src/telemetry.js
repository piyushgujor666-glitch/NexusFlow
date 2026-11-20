/** Strict, timezone-aware telemetry normalization for MongoDB Time-Series. */
const SENSOR_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

function parseTimestamp(input) {
  const match = typeof input === 'string' ? ISO_DATE_TIME.exec(input) : null;
  if (!match) throw new Error('Timestamp must be an ISO 8601 date-time with timezone');
  const [, y, mo, d, h, mi, s, , timezone] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(s);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leapYear ? 29 : 28, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthLengths[month-1] ||
      hour > 23 || minute > 59 || second > 59) throw new Error('Invalid timestamp');
  if (timezone !== 'Z') {
    const [offsetHour, offsetMinute] = timezone.slice(1).split(':').map(Number);
    if (offsetHour > 23 || offsetMinute > 59) throw new Error('Invalid timestamp');
  }
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid timestamp');
  return date;
}

export function normalizeReading(raw, now = () => new Date()) {
  if (typeof raw?.sensor !== 'string' || !SENSOR_ID.test(raw.sensor)) {
    throw new Error('Reading needs a valid sensor ID');
  }
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) {
    throw new Error('Reading needs a finite numeric value');
  }
  const timestamp = raw.timestamp == null ? now() : parseTimestamp(raw.timestamp);
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
