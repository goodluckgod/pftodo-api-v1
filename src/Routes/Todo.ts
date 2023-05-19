import express from 'express';
import { body } from 'express-validator';

import { isAuth } from '../Middlewares/Auth.js';

import { TodoPriority, TodoStatus } from '../Types/Todo.js';

import {
	createTodo,
	deleteTodo,
	getMyTodos,
	getTags,
	getTodo,
	updateTodo,
} from '../Controllers/Todo.js';

const router = express.Router();

router.get('/mine', [isAuth], getMyTodos);

router.get('/tags', [isAuth], getTags);

router.get('/:slug', [isAuth], getTodo);

router.post(
	'/create',
	[
		body('title').isString().isLength({ min: 3, max: 50 }),
		body('description').isString().isLength({ min: 3, max: 500 }),
		body('tags').isArray().withMessage('tags must be an array of strings'),
		body('file').isURL().optional(),
		body('thumbnail')
			.optional()
			.if((value) => value)
			.isString()
			.isURL(),
		body('isPublic').isBoolean().optional(),
		body('priority')
			.isIn(Object.keys(TodoPriority))
			.optional()
			.default(TodoPriority.LOW),
		body('status')
			.isIn(Object.keys(TodoStatus))
			.optional()
			.default(TodoStatus.ACTIVE),
		isAuth,
	],
	createTodo
);

router.put(
	'/update/:slug',
	[
		body('title').isString().isLength({ min: 3, max: 50 }).optional(),
		body('description').isString().isLength({ min: 3, max: 500 }).optional(),
		body('tags').isArray().isLength({ min: 0, max: 5 }).optional(),
		body('file').if((value) => value).isURL().optional(),
		body('thumbnail')
			.if((value) => value)
			.isString()
			.isURL()
			.optional(),
		body('isPublic').isBoolean().optional(),
		body('priority').isString().isIn(Object.values(TodoPriority)).optional(),
		body('status').isString().isIn(Object.values(TodoStatus)).optional(),
		isAuth,
	],
	updateTodo
);

router.delete('/delete/:slug', isAuth, deleteTodo);

export default router;
