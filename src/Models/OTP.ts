import mongoose, { Schema } from 'mongoose';

import { IOTP, OTPType } from '../Types/OTP.js';

const OTPSchema: Schema<IOTP> = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	otp: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		enum: Object.values(OTPType),
		default: OTPType.REGISTRATION,
		required: true,
	},
	isDummy: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5,
	},
});

const OTP = mongoose.model('OTP', OTPSchema);

export default OTP;
