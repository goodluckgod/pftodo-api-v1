import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import chalk from 'chalk';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import { logger } from './Utils/Logger.js';
import connectDB from './Config/Db.js';
import pkgjson from '../package.json';

// Router imports
import userRouter from './Routes/User.js';
import todoRouter from './Routes/Todo.js';
import assetRouter from './Routes/Asset.js';

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(`To-do API, version: ${pkgjson.version}`);
});

app.use(
	fileUpload({
		limits: { fileSize: 50 * 1024 * 1024 },
	})
);

const PORT = process.env.PORT || 3005;

app.listen(PORT, async () => {
	await logger.setup();
	await connectDB();
	logger.info(`Server listening on port ${chalk.green(PORT)}`);
	logger.info(`API version: ${chalk.italic(pkgjson.version)}`);
});

// Routes
app.use('/user', userRouter);
app.use('/todo', todoRouter);
app.use('/asset', assetRouter);

// Error handling
process.on('unhandledRejection', (err) => {
	logger.fatal('Unhandled rejection: ' + err);
	process.exit(1);
});

process.on('uncaughtException', (err) => {
	logger.fatal('Uncaught exception: ' + err);
	process.exit(1);
});

process.on('exit', () => {
	logger.info('Server shutting down at ' + new Date().toISOString());
});

// Environment variable check
if (!process.env.JWT_SECRET) {
	logger.fatal('JWT_SECRET not found');
	process.exit(1);
}
