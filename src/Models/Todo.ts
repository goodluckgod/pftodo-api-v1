import mongoose, { Schema } from 'mongoose';

import { ITodo, TodoPriority, TodoStatus } from '../Types/Todo.js';

const TodoSchema: Schema<ITodo> = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	tags: [
		{
			type: String,
			required: true,
		},
	],
	file: {
		type: String,
	},
	thumbnail: String,
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: Date,
	isPublic: {
		type: Boolean,
		default: false,
	},
	slug: {
		unique: true,
		type: String,
	},
	priority: {
		type: String,
		enum: Object.values(TodoPriority),
		default: TodoPriority.LOW,
	},
	status: {
		type: String,
		enum: Object.values(TodoStatus),
		default: TodoStatus.ACTIVE,
	},
});

// Create unique slug on first save only (6 letter random string) and check if it already exists
TodoSchema.pre('save', async function (next) {
	if (!this.isNew) return next();

	const createSlug = async () => {
		const todo = this;
		todo.slug = Math.random().toString(36).substring(2, 8);
		const slugExists = await mongoose.models.Todo.findOne({ slug: todo.slug });
		if (slugExists) createSlug();
	};

	await createSlug();
	next();
});

const Todo = mongoose.model('Todo', TodoSchema);

export default Todo;
