import { createLogger, format, transports } from 'winston';
import morgan from 'morgan';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const loggerFormat = format.printf(({ level, message, label, timestamp }) => {
  // quick and dirty pretty format from ISO
  timestamp = timestamp?.split('.')[0].replace('T', ' ');
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        loggerFormat
      ),
    }),
  ],
});

export const httpLogger = morgan('short', {
  stream: {
    write(message: string) {
      logger.log({ message: message.trim(), label: 'HTTP', level: 'info' });
    },
  },
});

export function info(message: string, label: string) {
  logger.log({ message: message.trim(), label, level: 'info' });
}

export function error(message: string, label: string) {
  logger.log({ message: message.trim(), label, level: 'error' });
}
