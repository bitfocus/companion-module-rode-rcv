import { LogLevel } from "./enums.js";
import { RCVInstance } from '../index.js';

let logLevel: LogLevel;


/**
 * Logs a message with the specified log level and optionally sends it to the console.
 * @param {string} message - The message to be logged.
 * @param {LogLevel} [level=logLevel] - The log level for the message.
 * @param {boolean} [sendToConsole=false] - Flag to determine if the message should also be logged to the console.
 */
function ConsoleLog(instance: RCVInstance, message: string, level: LogLevel = logLevel, sendToConsole: boolean = false) {
    // Log to Stream Deck logger based on the specified log level
    switch (level) {
        case LogLevel.DEBUG:
			instance.log('debug', message);
            break;
        case LogLevel.TRACE:
            instance.log('debug', message);
            break;
        case LogLevel.INFO:
            instance.log('info', message);
            break;
        case LogLevel.WARN:
            instance.log('warn', message);
            break;
        case LogLevel.ERROR:
            instance.log('error', message);
            break;
    }

    // Optionally log to the browser console based on the specified log level
    if (sendToConsole) {
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(message);
                break;
            case LogLevel.TRACE:
                console.trace(message);
                break;
            case LogLevel.INFO:
                console.info(message);
                break;
            case LogLevel.WARN:
                console.warn(message);
                break;
            case LogLevel.ERROR:
                console.error(message);
                break;
			default:
				console.log(message);
                break;
        }
    }
}

export { ConsoleLog };
