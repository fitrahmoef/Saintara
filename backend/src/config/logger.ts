import winston from 'winston';

// Sensitive data sanitization
const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'apikey', 'api_key', 'access_token', 'refresh_token'];

const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    // Don't sanitize entire string messages, just log them
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Custom format to sanitize sensitive data
const sanitizeFormat = winston.format((info) => {
  // Sanitize metadata
  if (info.meta) {
    info.meta = sanitizeData(info.meta);
  }

  // Sanitize any other object properties except message, level, timestamp
  const sanitized: any = { ...info };
  Object.keys(info).forEach(key => {
    if (!['message', 'level', 'timestamp', 'service', 'stack'].includes(key)) {
      if (typeof info[key] === 'object' && info[key] !== null) {
        sanitized[key] = sanitizeData(info[key]);
      }
    }
  });

  return sanitized;
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  sanitizeFormat(),
  winston.format.json()
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'saintara-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Log errors to error.log
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Log all to combined.log
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Stream for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
