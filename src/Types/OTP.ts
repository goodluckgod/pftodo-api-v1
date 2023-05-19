import mongoose from 'mongoose';

enum OTPType {
	REGISTRATION = 'REGISTRATION',
	FORGOT_PASSWORD = 'FORGOT_PASSWORD',
	CHANGE_EMAIL = 'CHANGE_EMAIL',
}

interface IOTP extends mongoose.Document {
	email: string;
	otp: string;
	createdAt: Date;
	type: OTPType;
	isDummy: boolean;
}

export { OTPType, IOTP };
