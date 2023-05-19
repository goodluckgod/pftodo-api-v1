import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

import Todo from '../Models/Todo.js';
import User from '../Models/User.js';

import logger from '../Utils/Logger.js';

const getIP = logger.getIP;

const getMyTodos = async function (req: Request, res: Response) {
	const IP = getIP(req);

	const email = res.locals.user.email;
	const currentTag = req.query.tag || null;
	const search = req.query.search || '';

	const todos = await Todo.aggregate([
		{
			$match: {
				createdBy: res.locals.user._id,
			},
		},
		{
			$match: {
				$or: [
					{
						title: {
							$regex: search,
							$options: 'i',
						},
					},
					{
						description: {
							$regex: search,
							$options: 'i',
						},
					},
					{
						tags: {
							$regex: search,
							$options: 'i',
						},
					},
					{
						priority: {
							$regex: search,
							$options: 'i',
						},
					},
					{
						status: {
							$regex: search,
							$options: 'i',
						},
					},
				],
			},
		},
	]);

	logger.trace(`${todos.length} todos found for ${email} from ${IP}`);

	res.send({
		data: todos,
	});
};

const getTags = async function (req: Request, res: Response) {
	const IP = getIP(req);
	const email = res.locals.user.email;
	const tags = await Todo.find({
		createdBy: res.locals.user._id,
	}).distinct('tags');

	logger.trace(`${tags.length} tags found for ${email} from ${IP}`);

	res.send({
		data: tags,
	});
};

const getTodo = async function (req: Request, res: Response) {
	const IP = getIP(req);

	const email = res.locals.user.email;
	const slug = req.params.slug;

	// Check if the todo is public or created by the user
	const todo = await Todo.findOne({
		$or: [
			{
				createdBy: res.locals.user._id,
			},
			{
				isPublic: true,
			},
		],
		slug: slug,
	}).populate('createdBy', 'name email avatar _id');

	if (!todo) {
		logger.trace(`Todo not found: ${slug} from ${email} from ${IP}`);
		return res.status(404).send({
			errors: [
				{
					msg: 'Todo not found',
					type: 'toast',
				},
			],
		});
	}

	logger.trace(`Todo found: ${slug} from ${email} from ${IP}`);

	res.send({
		data: {
			...todo.toJSON(),
			isOwner: todo.createdBy._id.toString() === res.locals.user._id.toString(),
		},
	});
};

const createTodo = async function (req: Request, res: Response) {
	const IP = getIP(req);
	const errors = validationResult(req);
	const email = res.locals.user.email;

	if (!errors.isEmpty()) {
		logger.trace(
			`Validation error: ${errors.array()} from ${email} from ${IP}`
		);
		return res.status(400).send(errors.array());
	}

	const user = await User.findOne({ email });

	if (!user) {
		logger.trace(`User not found: ${email} from ${IP}`);
		return res.status(400).send({
			errors: [
				{
					msg: 'User not found',
					type: 'toast',
				},
			],
		});
	}

	const {
		title,
		description,
		tags,
		file,
		thumbnail,
		isPublic,
		priority,
		status,
	} = req.body;

	const todo = new Todo({
		title,
		description,
		tags,
		file,
		thumbnail,
		isPublic,
		priority,
		status,
		createdBy: user._id,
	});

	await todo
		.save()
		.then((todo) => {
			logger.trace(`Todo created: ${todo.slug} from ${email} from ${IP}`);
			res.send({
				messages: [
					{
						msg: 'Todo created successfully',
						type: 'toast',
					},
				],
				data: todo,
			});
		})
		.catch((err) => {
			logger.trace(
				`Todo not saved: ${err} from ${email} from ${IP} (Unexpected error)`
			);
			return res.status(400).send({
				errors: [
					{
						msg: 'Unexpected error',
						type: 'toast',
					},
				],
			});
		});
};

const updateTodo = async function (req: Request, res: Response) {
	const IP = getIP(req);
	const errors = validationResult(req);
	const email = res.locals.user.email;
	const slug = req.params.slug;

	if (!errors.isEmpty()) {
		logger.trace(
			`Validation error: ${errors.array()} from ${email} from ${IP}`
		);
		return res.status(400).send(errors.array());
	}

	const todo = await Todo.findOne({
		slug: slug,
		createdBy: res.locals.user._id,
	});

	if (!todo) {
		logger.trace(`Todo not found: ${slug} from ${email} from ${IP}`);
		logger.warn(`This can be a cyber attack, please check it out! From ${IP}`);
		return res.status(404).send({
			errors: [
				{
					msg: 'Todo not found',
					type: 'toast',
				},
			],
		});
	}

	const {
		title,
		description,
		tags,
		file,
		thumbnail,
		isPublic,
		priority,
		status,
	} = req.body;

	if (title) todo.title = title;
	if (description) todo.description = description;
	if (tags) todo.tags = tags;
	if (file) todo.file = file;
	if (thumbnail) todo.thumbnail = thumbnail;
	if (isPublic !== undefined) todo.isPublic = isPublic;
	if (priority) todo.priority = priority;
	if (status) todo.status = status;

	await todo
		.save()
		.then((todo) => {
			logger.trace(`Todo saved: ${todo.slug} from ${email} from ${IP}`);

			res.send({
				messages: [
					{
						msg: 'Todo saved successfully',
						type: 'toast',
					},
				],
				data: todo,
			});
		})
		.catch((err) => {
			logger.trace(
				`Todo not saved: ${err} from ${email} from ${IP} (Unexpected error)`
			);
			return res.status(400).send({
				errors: [
					{
						msg: 'Unexpected error',
						type: 'toast',
					},
				],
			});
		});
};

const deleteTodo = async function (req: Request, res: Response) {
	const IP = getIP(req);
	const email = res.locals.user.email;
	const slug = req.params.slug;

	const todo = await Todo.findOne({
		slug: slug,
		createdBy: res.locals.user._id,
	});

	if (!todo) {
		logger.trace(`Todo not found: ${slug} from ${email} from ${IP}`);
		logger.warn(`This can be a cyber attack, please check it out! From ${IP}`);
		return res.status(404).send({
			errors: [
				{
					msg: 'Todo not found',
					type: 'toast',
				},
			],
		});
	}

	await todo.deleteOne().catch((err) => {
		logger.trace(
			`Todo not deleted: ${err} from ${email} from ${IP} (Unexpected error)`
		);
		return res.status(400).send({
			errors: [
				{
					msg: 'Unexpected error',
					type: 'toast',
				},
			],
		});
	});

	logger.trace(`Todo deleted: ${todo.slug} from ${email} from ${IP}`);

	res.send({
		messages: [
			{
				msg: 'Todo deleted successfully',
				type: 'toast',
			},
		],
		data: todo,
	});
};

export { getMyTodos, getTags, getTodo, createTodo, updateTodo, deleteTodo };
