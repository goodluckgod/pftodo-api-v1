import express from 'express';
import { body } from 'express-validator';

import { isAuth, isNotAuth, checkOTPType } from '../Middlewares/Auth.js';

import {
	onForgotPassword,
	onLogin,
	onRegister,
	onResendOTP,
	onUpdate,
	onVerifyOTP,
} from '../Controllers/User.js';

import { OTPType } from '../Types/OTP.js';

const router = express.Router();

/**
 * @route /user/verify-otp
 * @method POST
 * @description Verify OTP for registration, forgot password and change email
 * @access Public (for change email it is private)
 * @param email, OTP, Type, password (if type is forgot password)
 * @returns {object} message
 */
router.post(
	'/verify-otp',
	[
		body('email').isEmail().withMessage('email must be valid'),
		body('otp')
			.isLength({ min: 6, max: 6 })
			.withMessage('OTP must be 6 characters long'),
		body('type')
			.isIn([
				OTPType.REGISTRATION,
				OTPType.FORGOT_PASSWORD,
				OTPType.CHANGE_EMAIL,
			])
			.withMessage('type must be valid'),
		body('password')
			.if((value, { req }) => req.body.type === OTPType.FORGOT_PASSWORD)
			.isLength({ min: 6 })
			.withMessage('password must be at least 6 characters long'),
		checkOTPType,
	],
	onVerifyOTP
);

/**
 * @route /user/forgot-password
 * @method POST
 * @description Send OTP to email for forgot password
 * @access Public (only if user is not authenticated)
 * @param email
 * @returns {object} message
 * @example
 * {
 * 	"email": "example@test.com" // valid email
 * } // It will send OTP to email
 * @example
 * {
 * 	"email": "example@test.com" // invalid email
 * } // It will send fake message to client and save OTP to database with "dummy: true" for blocking brute force attacks
 */
router.post(
	'/forgot-password',
	[body('email').isEmail().withMessage('email must be valid'), isNotAuth],
	onForgotPassword
);

/**
 * @route /user/resend-otp
 * @method POST
 * @description Resend OTP to email for registration, forgot password and change email
 * @access Public (for change email it is private)
 * @param email
 * @returns {object} message
 * @example
 * {
 * 	"email": "example@test.com" // valid email
 * } // It will resend OTP to email
 * @example
 * {
 * 	"email": "example@test.com" // invalid email, otp not exist
 * } // It will throw error (email must be valid)
 * @example
 * {
 * 	"email": "example@test.com" // invalid email but it's dummy for blocking brute force attacks for forgot password
 * } // It will send OTP sended to email but it will not send email.
 */
router.post(
	'/resend-otp',
	[body('email').isEmail().withMessage('email must be valid'), isNotAuth],
	onResendOTP
);

/**
 * @route /user/register
 * @method POST
 * @description Register user
 * @access Public (only if user is not authenticated)
 * @param name, email, password, avatar (optional)
 * @returns {object} message
 */
router.post(
	'/register',
	[
		body('name')
			.isLength({ min: 3 })
			.withMessage('name must be at least 3 characters long'),
		body('password')
			.isLength({ min: 6 })
			.withMessage('password must be at least 6 characters long'),
		body('email').isEmail().withMessage('email must be valid'),
		body('avatar')
			.if((value) => value)
			.isURL()
			.withMessage('avatar must be valid URL'),
		isNotAuth,
	],
	onRegister
);

/**
 * @route /user/login
 * @method POST
 * @description Login user
 * @access Public (only if user is not authenticated)
 * @param email, password
 * @returns {object} message
 */
router.post(
	'/login',
	[
		body('password')
			.isLength({ min: 6 })
			.withMessage('password must be at least 6 characters long'),
		body('email').isEmail().withMessage('email must be valid'),
		isNotAuth,
	],
	onLogin
);

/**
 * @route /user/update
 * @method PUT
 * @description Update user, if email is changed then it will send OTP to new email.
 * @access Private (only self update)
 * @param name, email, name, password, oldPassword (if password is provided), avatar (optional)
 * @returns {object} message
 */
router.put(
	'/update',
	[
		body('name')
			.if((value) => value)
			.isLength({ min: 3 })
			.withMessage('name must be at least 3 characters long'),
		body('email')
			.if((value) => value)
			.isEmail()
			.withMessage('email must be valid'),
		body('oldPassword')
			.if((value) => value)
			.isLength({ min: 6 })
			.withMessage('oldPassword must be at least 6 characters long'),
		body('password')
			.if((value) => value)
			.isLength({ min: 6 })
			.withMessage('password must be at least 6 characters long'),
		body('avatar')
			.if((value) => value)
			.isURL()
			.withMessage('avatar must be valid url'),
		isAuth,
	],
	onUpdate
);

export default router;
