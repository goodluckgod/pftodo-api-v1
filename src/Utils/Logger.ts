import { Request } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import chalk from 'chalk';
import fs from 'fs';

import { LogLevel } from '../Types/Logger.js';

const getIP = (req: Request) => {
	let IP =
		(req.headers['x-forwarded-for'] as string) ||
		req.socket.remoteAddress ||
		'IP not found';
	// If ipv6, extract ipv4
	IP = IP.includes(':') ? IP.split(':').reverse()[0] : IP;
	return IP;
};

let { LOG_LEVEL, LOG_LEVEL_FOR_FILE, DELETE_LOGS_OLDER_THAN } = process.env;
let logFileName = '';

if (!LOG_LEVEL) LOG_LEVEL = '0';
if (!LOG_LEVEL_FOR_FILE) LOG_LEVEL_FOR_FILE = '0';
if (!DELETE_LOGS_OLDER_THAN) DELETE_LOGS_OLDER_THAN = '30';

const logLevel = parseInt(LOG_LEVEL);
const logLevelForFile = parseInt(LOG_LEVEL_FOR_FILE);
const deleteLogsOlderThan = parseInt(DELETE_LOGS_OLDER_THAN);

const trace = (...messages: string[]) => {
	log(LogLevel.TRACE, ...messages);
};

const debug = (...messages: string[]) => {
	log(LogLevel.DEBUG, ...messages);
};

const info = (...messages: string[]) => {
	log(LogLevel.INFO, ...messages);
};

const warn = (...messages: string[]) => {
	log(LogLevel.WARN, ...messages);
};

const error = (...messages: string[]) => {
	log(LogLevel.ERROR, ...messages);
};

const fatal = (...messages: string[]) => {
	log(LogLevel.FATAL, ...messages);
};

const log = (type: LogLevel, ...messages: string[]) => {
	let color = chalk.white;
	switch (type) {
		case LogLevel.TRACE:
			color = chalk.gray;
			break;
		case LogLevel.DEBUG:
			color = chalk.blue;
			break;
		case LogLevel.INFO:
			color = chalk.green;
			break;
		case LogLevel.WARN:
			color = chalk.yellow;
			break;
		case LogLevel.ERROR:
			color = chalk.red;
			break;
		case LogLevel.FATAL:
			color = chalk.bgRed;
			break;
	}

	const message = `${color(`[${LogLevel[type]}]`)} ${messages.join(' ')}`;

	if (logLevelForFile <= type) {
		addToFile(message + '\n');
	}

	if (logLevel > type) return;
	console.log(message);
};

const setup = async () => {
	// Set up logging
	return new Promise<void>((resolve, reject) => {
		logFileName = `./Logs/${new Date().toISOString().replace(/:/g, '-')}.log`;
		fs.mkdirSync('./Logs', { recursive: true });
		fs.writeFile(
			logFileName,
			`LOG LEVEL: ${logLevelForFile}\nStarted logging at ${new Date().toLocaleString()}\n\n`,
			(err) => {
				if (err) throw err;
				info(`Logging to ${chalk.green(logFileName)}`);
				resolve();
			}
		);

		// Delete old log files
		if (DELETE_LOGS_OLDER_THAN !== '0') {
			const files = fs.readdirSync('./Logs');
			const now = Date.now();

			for (const file of files) {
				const filePath = `./Logs/${file}`;

				const { birthtimeMs } = fs.statSync(filePath);
				const age = now - birthtimeMs;

				// if (age > deleteLogsOlderThan * (24 * 60 * 60 * 1000)) {
				if (age > deleteLogsOlderThan) {
					fs.unlinkSync(filePath);

					info(`Deleted log file ${chalk.green(file)}`);
				}
			}
		}
	});
};

const addToFile = (message: string) => {
	message = message.replace(/\u001b\[.*?m/g, '');
	fs.appendFile(logFileName, message, (err) => {
		if (err) throw err;
	});
};

export const logger = {
	getIP,
	setup,
	trace,
	debug,
	info,
	warn,
	error,
	fatal,
};

export default logger;
