import nodemailer, { SentMessageInfo } from 'nodemailer';
import chalk from 'chalk';

import getTransporter from '../Config/Mailer.js';
import logger from './Logger.js';

const checkPreviewURL = (info: SentMessageInfo) => {
	const previewURL = nodemailer.getTestMessageUrl(info);

	if (!previewURL) return;

	logger.warn(
		`You are using test account, you should preview the email at: ${chalk.bgBlueBright(
			previewURL
		)}`
	);

	return previewURL;
};

const sendRegisterOTP = async (
	email: string,
	name: string,
	otp: string | number
) => {
	const transporter = await getTransporter();

	let info: SentMessageInfo = await transporter
		.sendMail({
			from: `Playable Factory <${process.env.MAILER_EMAIL}>`,
			to: email,
			subject: `Welcome, ${name}! Here's your OTP: ${otp}`,
			text: `Welcome, ${name}! Here's your OTP: ${otp}`,
			html: `<b>Welcome, ${name}! Here's your OTP: ${otp}</b>`,
		})
		.catch((err: string) => {
			logger.error(err);
		});

	checkPreviewURL(info);

	logger.trace(`Registeration OTP sent for: ${chalk.bgBlueBright(email)}`);
};

const sendForgotPasswordOTP = async (email: string, otp: string | number) => {
	const transporter = await getTransporter();

	let info: SentMessageInfo = await transporter
		.sendMail({
			from: `Playable Factory <${process.env.MAILER_EMAIL}>`,
			to: email,
			subject: `Forgot Password OTP: ${otp}`,
			text: `Forgot Password OTP: ${otp}`,
			html: `<b>Forgot Password OTP: ${otp}</b>`,
		})
		.catch((err: string) => {
			logger.error(err);
		});

	checkPreviewURL(info);

	logger.trace(`Forgot Password OTP sent for: ${chalk.bgBlueBright(email)}`);
};

const sendChangeEmailOTP = async (email: string, otp: string | number) => {
	const transporter = await getTransporter();

	let info: SentMessageInfo = await transporter
		.sendMail({
			from: `Playable Factory <${process.env.MAILER_EMAIL}>`,
			to: email,
			subject: `Change Email OTP: ${otp}`,
			text: `Change Email OTP: ${otp}`,
			html: `<b>Change Email OTP: ${otp}</b>`,
		})
		.catch((err: string) => {
			logger.error(err);
		});

	checkPreviewURL(info);
};

export { sendRegisterOTP, sendForgotPasswordOTP, sendChangeEmailOTP };
