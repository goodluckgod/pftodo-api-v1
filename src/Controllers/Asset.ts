import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';

import uploadFile from '../Utils/S3.js';

import logger from '../Utils/Logger.js';

const getIP = logger.getIP;

const uploadAvatar = async (req: Request, res: Response) => {
	const IP = getIP(req);

	const emailOrUnknown = res?.locals?.user?.email || 'unknown';

	try {
		const avatar = req.files?.avatar as UploadedFile;

		if (avatar.size > 1 * 1024 * 1024) {
			logger.error(`Avatar of ${IP}, ${emailOrUnknown} is too large`);
			return res.status(400).json({
				errors: [
					{
						msg: 'avatar is too large',
						type: 'toast',
					},
				],
			});
		}

		if (!avatar) {
			logger.error(`Avatar of ${IP}, ${emailOrUnknown} not found`);
			return res.status(400).json({
				errors: [
					{
						msg: 'avatar not found',
						type: 'toast',
					},
				],
			});
		}

		if (
			avatar.mimetype !== 'image/jpeg' &&
			avatar.mimetype !== 'image/png' &&
			avatar.mimetype !== 'image/jpg'
		) {
			logger.error(`Avatar of ${IP}, ${emailOrUnknown} is not an image`);
			return res.status(400).json({
				errors: [
					{
						msg: 'avatar is not an image',
						type: 'toast',
					},
				],
			});
		}

		const data = await uploadFile(
			avatar,
			res?.locals?.user?._id.toString() || Math.random().toString()
		);

		logger.info(`Avatar of ${IP} uploaded successfully`);

		res.json({
			messages: [
				{
					msg: 'avatar uploaded successfully',
					type: 'toast',
				},
			],
			data: {
				location: data.Location,
			},
		});
	} catch (err) {
		logger.error(`Error while uploading avatar of ${IP} - ${err}`);

		res.status(500).json({
			errors: [
				{
					msg: 'internal server error',
					type: 'toast',
				},
			],
		});
	}
};

const uploadThumbnail = async (req: Request, res: Response) => {
	const IP = getIP(req);

	if (!res.locals.user) {
		logger.error(`Unauthorized request from ${IP}`);
		return res.status(401).json({
			errors: [
				{
					msg: 'unauthorized',
					type: 'toast',
				},
			],
		});
	}

	try {
		const thumbnail = req.files?.thumbnail as UploadedFile;

		if (thumbnail.size > 3 * 1024 * 1024) {
			logger.error(`Thumbnail of ${IP}, ${res.locals.user.email} is too large`);
			return res.status(400).json({
				errors: [
					{
						msg: 'avatar is too large',
						type: 'toast',
					},
				],
			});
		}

		if (!thumbnail) {
			logger.error(`Thumbnail of ${IP}, ${res.locals.user.email} not found`);
			return res.status(400).json({
				errors: [
					{
						msg: 'avatar not found',
						type: 'toast',
					},
				],
			});
		}

		if (
			thumbnail.mimetype !== 'image/jpeg' &&
			thumbnail.mimetype !== 'image/png' &&
			thumbnail.mimetype !== 'image/jpg'
		) {
			logger.error(
				`Thumbnail of ${IP}, ${res.locals.user.email} is not an image`
			);
			return res.status(400).json({
				errors: [
					{
						msg: 'thumbnail is not an image',
						type: 'toast',
					},
				],
			});
		}

		const data = await uploadFile(thumbnail, res.locals.user._id.toString());

		logger.info(`Thumbnail of ${IP} uploaded successfully`);

		res.json({
			messages: [
				{
					msg: 'thumbnail uploaded successfully',
					type: 'toast',
				},
			],
			data: {
				location: data.Location,
			},
		});
	} catch (err) {
		logger.error(`Error while uploading thumbnail of ${IP} - ${err}`);

		res.status(500).json({
			errors: [
				{
					msg: 'internal server error',
					type: 'toast',
				},
			],
		});
	}
};

const uploadFileC = async (req: Request, res: Response) => {
	const IP = getIP(req);

	if (!res.locals.user) {
		logger.error(`Unauthorized request from ${IP}`);
		return res.status(401).json({
			errors: [
				{
					msg: 'unauthorized',
					type: 'toast',
				},
			],
		});
	}

	try {
		const file = req.files?.file as UploadedFile;

		if (file.size > 10 * 1024 * 1024) {
			logger.error(`File of ${IP}, ${res.locals.user.email} is too large`);
			return res.status(400).json({
				errors: [
					{
						msg: 'file is too large',
						type: 'toast',
					},
				],
			});
		}

		if (!file) {
			logger.error(`File of ${IP}, ${res.locals.user.email} not found`);
			return res.status(400).json({
				errors: [
					{
						msg: 'file not found',
						type: 'toast',
					},
				],
			});
		}

		const data = await uploadFile(file, res.locals.user._id.toString());

		logger.info(`File of ${IP} uploaded successfully`);

		res.json({
			messages: [
				{
					msg: 'file uploaded successfully',
					type: 'toast',
				},
			],
			data: {
				location: data.Location,
			},
		});
	} catch (err) {
		logger.error(`Error while uploading file of ${IP} - ${err}`);

		res.status(500).json({
			errors: [
				{
					msg: 'internal server error',
					type: 'toast',
				},
			],
		});
	}
};

export { uploadAvatar, uploadThumbnail, uploadFileC };
