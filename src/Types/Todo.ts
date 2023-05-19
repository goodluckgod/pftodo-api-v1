import mongoose, { PopulatedDoc } from 'mongoose';
import { IUser } from './User.js';

enum TodoStatus {
	ACTIVE = 'ACTIVE',
	ONWORK = 'ONWORK',
	COMPLETED = 'COMPLETED',
}

enum TodoPriority {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH',
}

interface ITodo extends mongoose.Document {
	title: string;
	isPublic: boolean;
	createdBy: PopulatedDoc<IUser & mongoose.Document>;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	status: TodoStatus;
	priority: TodoPriority;
	file: string;
	tags: string[];
	thumbnail: string;
	slug: string;
}

export { TodoStatus, TodoPriority, ITodo };
