import nodemailer from 'nodemailer';
import chalk from 'chalk';

import logger from '../Utils/Logger.js';

let testAccount: nodemailer.TestAccount | null;

const getTransporter = async () => {
	if (!testAccount) {
		testAccount = await nodemailer.createTestAccount();
		logger.info(
			`Test account created: ${chalk.bgBlueBright(
				testAccount.user
			)}, ${chalk.redBright(testAccount.pass)}`
		);
	}

	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: testAccount.user,
			pass: testAccount.pass,
		},
	});

	return transporter;
};

export default getTransporter;
