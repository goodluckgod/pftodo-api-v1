import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

import User from '../Models/User.js';
import OTP from '../Models/OTP.js';

import {
	sendRegisterOTP,
	sendForgotPasswordOTP,
	sendChangeEmailOTP,
} from '../Utils/Mailer.js';
import { makeOTP } from '../Utils/OTP.js';
import logger from '../Utils/Logger.js';

import { OTPType } from '../Types/OTP.js';

const getIP = logger.getIP;

const OTPResendTime = parseInt(process.env.OTP_RESEND_TIME || '60') * 1000;

const onVerifyOTP = async (req: Request, res: Response) => {
	const IP = getIP(req);

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace(`OTP verification failed for ${req.body.type} for IP:`, IP);
		return res.status(422).json({ errors: errors.array() });
	}

	const foundOTP = await OTP.findOne({
		email: req.body.email,
		type: req.body.type,
	});

	if (foundOTP && foundOTP.isDummy) {
		logger.trace(
			`OTP verification failed for ${req.body.type} for IP: (Dummy OTP)`,
			IP
		);
		logger.warn(
			`Dummy OTP verification failed for ${req.body.type} for IP:`,
			IP,
			`it can be a sign of malicious activity`
		);

		// Send OTP is incorrect error anyway
		return res.status(422).json({
			errors: [{ msg: 'OTP is incorrect', type: 'field', path: 'otp' }],
		});
	}

	if (!foundOTP) {
		logger.trace(
			`OTP verification failed for ${req.body.type} for IP: (OTP not found)`,
			IP
		);
		return res.status(422).json({
			errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
		});
	}

	if (foundOTP.otp !== req.body.otp) {
		logger.trace(
			`OTP verification failed for ${req.body.type} for IP: (OTP incorrect)`,
			IP
		);
		return res.status(422).json({
			errors: [{ msg: 'OTP is incorrect', type: 'field', path: 'otp' }],
		});
	}

	await OTP.deleteOne({
		_id: foundOTP._id,
	});

	const foundUser = await User.findOne({
		email:
			req.body.type === OTPType.CHANGE_EMAIL
				? res.locals.user.email
				: req.body.email,
	});

	if (!foundUser) {
		logger.trace(
			`OTP verification failed for ${req.body.type} for IP: (User not found)`,
			IP
		);
		return res.status(422).json({
			errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
		});
	}

	if (req.body.type === OTPType.REGISTRATION) {
		foundUser.isValidated = true;
	} else if (req.body.type === OTPType.FORGOT_PASSWORD) {
		foundUser.password = req.body.password;
	} else if (req.body.type === OTPType.CHANGE_EMAIL) {
		foundUser.email = req.body.email;
	}

	await foundUser.save();

	logger.trace('OTP verification for forgot password successful for IP:', IP);

	let message = 'OTP verified successfully';

	switch (req.body.type) {
		case OTPType.REGISTRATION:
			message = 'Registration successful';
			break;
		case OTPType.FORGOT_PASSWORD:
			message = 'Password changed successfully';
			break;
		case OTPType.CHANGE_EMAIL:
			message = 'Email changed successfully';
			break;
	}

	return res.status(200).json({
		messages: [{ msg: message, type: 'toast' }],
		data: {
			avatar: foundUser.avatar,
			email: foundUser.email,
			name: foundUser.name,
			token: jwt.sign(
				{ email: foundUser.email },
				process.env.JWT_SECRET as string,
				{
					expiresIn: '30d',
				}
			),
		},
	});
};

const onForgotPassword = async (req: Request, res: Response) => {
	const IP = getIP(req);
	let continueProcess = true;

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace('Forgot password failed for IP: (Validation error)', IP);
		return res.status(422).json({ errors: errors.array() });
	}

	const foundUser = await User.findOne({ email: req.body.email });

	if (!foundUser) {
		logger.trace('Forgot password failed for IP (User not found):', IP);
		continueProcess = false;
	}

	const foundOTP = await OTP.findOne({
		email: req.body.email,
		type: OTPType.FORGOT_PASSWORD,
	});

	if (foundOTP && Date.now() - foundOTP.createdAt.getTime() < OTPResendTime) {
		logger.trace(`OTP resend failed for IP: (OTP already sent)`, IP);
		return res.status(422).json({
			errors: [
				{
					msg: `OTP already sent, wait ${Math.floor(
						(OTPResendTime - (Date.now() - foundOTP.createdAt.getTime())) / 1000
					)}s`,
					type: 'toast',
				},
			],
		});
	} else if (foundOTP) {
		await OTP.deleteOne({
			_id: foundOTP._id,
		});
	}

	const otp = makeOTP();

	await OTP.create({
		email: req.body.email,
		otp,
		type: OTPType.FORGOT_PASSWORD,
		isDummy: continueProcess ? false : true,
	});

	if (continueProcess) {
		sendForgotPasswordOTP(req.body.email, otp);

		logger.trace('Forgot password successful for IP:', IP);
	}

	return res.status(200).json({
		messages: [
			{
				msg: 'If the email is registered, an OTP has been sent to it',
				type: 'toast',
			},
		],
	});
};

const onResendOTP = async (req: Request, res: Response) => {
	const IP = getIP(req);

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace('OTP resend failed for IP: (Validation error)', IP);
		return res.status(422).json({ errors: errors.array() });
	}

	const existOTP = await OTP.findOne({ email: req.body.email });

	if (existOTP && Date.now() - existOTP.createdAt.getTime() < OTPResendTime) {
		logger.trace(`OTP resend failed for IP: (OTP already sent)`, IP);
		return res.status(422).json({
			errors: [
				{
					msg: `OTP already sent, wait ${Math.floor(
						(OTPResendTime - (Date.now() - existOTP.createdAt.getTime())) / 1000
					)}s`,
					type: 'toast',
				},
			],
		});
	} else if (existOTP) {
		await OTP.deleteOne({
			_id: existOTP._id,
		});
	} else {
		// Disabled for new DUMMY OTP
		// // If OTP doesn't exist and type is password change, for security reasons don't send any error
		// logger.trace('OTP resend failed for IP: (OTP not found)', IP);

		// if (req.body.type === OTPType.FORGOT_PASSWORD) {
		// 	logger.warn(
		// 		`OTP resend failed for IP: (OTP not found) but type is ${OTPType.FORGOT_PASSWORD} It can be a case of brute force attack`,
		// 		IP
		// 	);
		// 	return res.status(200).json({
		// 		messages: [{ msg: 'OTP sent successfully', type: 'toast' }],
		// 	});
		// }

		return res.status(422).json({
			errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
		});
	}

	if (existOTP.isDummy) {
		const otp = makeOTP();

		await OTP.create({
			email: req.body.email,
			otp,
			type: OTPType.FORGOT_PASSWORD,
			isDummy: true,
		});

		logger.trace('OTP resend successful for IP: (Dummy OTP)', IP);
		return res.status(200).json({
			messages: [{ msg: 'OTP sent successfully', type: 'toast' }],
		});
	}

	const user = await User.findOne({ email: req.body.email });

	if (existOTP.type !== OTPType.CHANGE_EMAIL && !user) {
		logger.trace('OTP resend failed for IP: (User not found)', IP);
		return res.status(422).json({
			errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
		});
	}

	// Ignored because it's not possible for user to be null (see above)
	//@ts-ignore
	if (existOTP.type === OTPType.REGISTRATION && user.isValidated) {
		logger.trace('OTP resend failed for IP: (Email already validated)', IP);
		return res.status(422).json({
			errors: [{ msg: 'Email already validated', type: 'toast' }],
		});
	}

	const otp = makeOTP();

	await OTP.create({
		email: req.body.email,
		otp,
		type: existOTP.type,
	});

	switch (existOTP.type) {
		case OTPType.REGISTRATION:
			// Ignored because it's not possible for user to be null (see above)
			//@ts-ignore
			sendRegisterOTP(req.body.email, user.name, otp);
			break;
		case OTPType.FORGOT_PASSWORD:
			sendForgotPasswordOTP(req.body.email, otp);
			break;
		case OTPType.CHANGE_EMAIL:
			sendChangeEmailOTP(req.body.email, otp);
			break;
		default:
			logger.fatal('OTP type not found');
			break;
	}

	logger.trace('OTP resend success for IP:', IP);
	return res.status(200).json({
		messages: [{ msg: 'OTP sent successfully', type: 'toast' }],
	});
};

const onRegister = async (req: Request, res: Response) => {
	const IP = getIP(req);

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace('User registration failed for IP: (Validation error)', IP);
		return res.status(422).json({ errors: errors.array() });
	}

	const existUser = await User.findOne({ email: req.body.email });

	if (existUser && !existUser.isValidated) {
		const existOTP = await OTP.findOne({ email: req.body.email });

		if (existOTP && Date.now() - existOTP.createdAt.getTime() < OTPResendTime) {
			return res.status(422).json({
				errors: [
					{
						msg: `OTP already sent, wait ${Math.floor(
							(OTPResendTime - (Date.now() - existOTP.createdAt.getTime())) /
								1000
						)}s`,
						type: 'toast',
					},
				],
			});
		} else if (existOTP) {
			await User.deleteOne({ _id: existUser._id });

			await OTP.deleteOne({
				_id: existOTP._id,
			});
		}
	} else if (existUser && existUser.isValidated) {
		logger.trace(
			'User registration failed for IP: (Email already registered)',
			IP
		);
		return res.status(422).json({
			errors: [
				{ msg: 'Email already registered', type: 'field', path: 'email' },
			],
		});
	}

	const user = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		avatar: req.body.avatar,
	};

	User.create(user)
		.then((createdUser) => {
			OTP.create({
				email: createdUser.email,
				otp: makeOTP(),
			})
				.then((otp) => {
					sendRegisterOTP(createdUser.email, createdUser.name, otp.otp);
				})
				.catch((err) => {
					logger.error(err);
					res.status(500).json({
						errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
					});
					logger.error(
						'User registration failed for IP: (OTP creation error)',
						IP
					);
				});

			res.status(201).json({
				messages: [
					{
						msg: 'registered successfully, please verify your email',
						type: 'toast',
					},
				],
				data: {
					email: createdUser.email,
				},
			});
			logger.trace('User registered successfully and OTP sended for IP:', IP);
		})
		.catch((err) => {
			logger.error(err);
			res.status(500).json({
				errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
			});
			logger.error(
				'User registration failed for IP: (User creation error)',
				IP
			);
		});
};

const onLogin = (req: Request, res: Response) => {
	const IP = getIP(req);

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace('User login failed for IP: (Validation error)', IP);
		return res.status(422).json({ errors: errors.array() });
	}

	User.findOne({ email: req.body.email })
		.select('+password')
		.then(async (user) => {
			if (!user) {
				logger.trace('User login failed for IP (Invalid credentials):', IP);
				return res.status(400).json({
					errors: [
						{ msg: 'Invalid credentials', type: 'field', path: 'email' },
					],
				});
			}

			if (!user?.isValidated) {
				logger.trace('User login failed for IP (Email not validated):', IP);
				return res.status(400).json({
					errors: [
						{ msg: 'Email not validated', type: 'toast', path: 'email' },
					],
				});
			}

			if (await user.comparePassword(req.body.password)) {
				logger.trace('User logged in successfully for IP:', IP);
				return res.status(200).json({
					messages: [{ msg: 'logged in successfully', type: 'toast' }],
					data: {
						name: user.name,
						email: user.email,
						avatar: user.avatar,
						token: jwt.sign(
							{ email: req.body.email },
							process.env.JWT_SECRET as string,
							{
								expiresIn: '30d',
							}
						),
					},
				});
			} else {
				logger.trace('User login failed for IP (Invalid credentials):', IP);
				return res.status(400).json({
					errors: [
						{ msg: 'Invalid credentials', type: 'field', path: 'email' },
					],
				});
			}
		})
		.catch((err) => {
			logger.error(err);
			res.status(500).json({
				errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
			});
			logger.error('User login failed for IP (Unexpected Error):', IP);
		});
};

const onUpdate = (req: Request, res: Response) => {
	const IP = getIP(req);

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		logger.trace('User update failed for IP: (Validation error)', IP);
		return res.status(422).json({ errors: errors.array() });
	}

	User.findOne({ email: res.locals.user.email })
		.select('+password')
		.then(async (user) => {
			if (!user) throw new Error('User not found');

			const isEmailChanged = req.body.email && req.body.email !== user.email;

			if (req.body.name) user.name = req.body.name;
			if (req.body.avatar) user.avatar = req.body.avatar;

			if (req.body.password || isEmailChanged) {
				if (!(await user.comparePassword(req.body.oldPassword))) {
					logger.trace('User update failed for IP (Invalid credentials):', IP);
					const message = !req.body.oldPassword
						? 'current password is required for critical changes'
						: 'invalid password';
					return res.status(400).json({
						errors: [{ msg: message, type: 'field', path: 'oldPassword' }],
					});
				}
			}

			if (req.body.password) user.password = req.body.password;

			if (isEmailChanged) {
				const otp = makeOTP();

				OTP.create({
					email: req.body.email,
					otp,
					type: OTPType.CHANGE_EMAIL,
				});

				sendChangeEmailOTP(req.body.email, otp);

				logger.trace('User update OTP sended successfully for IP:', IP);
			}

			await user.save();

			res.status(200).json({
				messages: [
					{
						msg: 'user updated successfully',
						type: 'toast',
					},
				],
				data: {
					name: user.name,
					email: user.email,
					avatar: user.avatar,
					isEmailChanged: isEmailChanged ? true : false,
				},
			});

			logger.trace('User updated successfully for IP:', IP);
		})
		.catch((err) => {
			logger.error(err);
			res.status(500).json({
				errors: [{ msg: 'Unexpected error occured', type: 'toast' }],
			});
			logger.error('User update failed for IP (Unexpected Error):', IP);
		});
};

export {
	onVerifyOTP,
	onForgotPassword,
	onResendOTP,
	onRegister,
	onLogin,
	onUpdate,
};
