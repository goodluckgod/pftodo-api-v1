import mongoose from 'mongoose';

interface IUser extends mongoose.Document {
	name: string;
	email: string;
	password: string;
	token: string;
	isValidated: boolean;
	createdAt: Date;
	avatar: string;
	comparePassword(password: string): Promise<boolean>;
}

export { IUser };
