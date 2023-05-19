import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

import { IUser } from '../Types/User.js';

const UserSchema: Schema<IUser> = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	avatar: String,
	password: {
		type: String,
		required: true,
		select: false,
	},
	isValidated: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

UserSchema.pre('save', async function (next) {
	const user = this;
	if (!user.isModified('password')) return next();
	user.password = await bcrypt.hash(user.password, 10);
	next();
});

UserSchema.method('comparePassword', async function (password: string) {
	const user = this;
	return await bcrypt.compare(password, user.password);
});

const User = mongoose.model('User', UserSchema);

export default User;
