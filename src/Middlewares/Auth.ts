import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../Models/User.js';
import logger from '../Utils/Logger.js';
import { OTPType } from '../Types/OTP.js';

const isNotAuth = async (req: Request, res: Response, next: NextFunction) => {
	let token = req.headers.authorization?.split(' ')[1];
	if (token) {
		logger.trace('User is already authenticated');

		res.status(401).json({
			errors: [
				{
					msg: 'You are already authorized',
					type: 'toast',
				},
			],
		});

		return;
	}

	next();
};

const isAuth = async (req: Request, res: Response, next: NextFunction) => {
	let token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		logger.trace('User is not authenticated');

		res.status(401).json({
			errors: [
				{
					msg: 'You are not authorized',
					type: 'toast',
				},
			],
		});

		return;
	}

	const { email } = jwt.verify(token, process.env.JWT_SECRET as string) as {
		email: string;
	};

	let user = await User.findOne({ email });

	if (!user) {
		res.status(401).json({
			errors: [
				{
					msg: 'You are not authorized',
					type: 'toast',
				},
			],
		});

		return;
	}

	res.locals.user = user;

	next();
};

const checkOTPType = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	let type: OTPType = req.body.type;

	if (type === OTPType.REGISTRATION || type === OTPType.FORGOT_PASSWORD) {
		isNotAuth(req, res, next);
	} else {
		isAuth(req, res, next);
	}
};

export { isNotAuth, isAuth, checkOTPType };
