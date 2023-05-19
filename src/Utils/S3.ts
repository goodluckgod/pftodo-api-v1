import dotenv from 'dotenv';
dotenv.config();
import sharp from 'sharp';
import { s3 } from '../Config/AWS.js';
import logger from './Logger.js';
import { UploadedFile } from 'express-fileupload';

const uploadFile = async (file: UploadedFile, uploadName: string) => {
	if (!process.env.AWS_BUCKET_NAME) {
		logger.fatal('AWS_BUCKET_NAME not found in .env');
		throw new Error('AWS_BUCKET_NAME not found in .env');
	}

	const params = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `${uploadName}-${Date.now()}-${file.name}`,
		Body: file.data,
	};

	// Check if file image, then use sharp to compress
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg'
	) {
		const resizedImage = await sharp(file.data)
			.png({
				quality: 60,
			})
			.toBuffer();
		params.Body = resizedImage;
	}

	logger.info(`Uploading ${file.name} to S3`);

	return s3.upload(params).promise();
};

export default uploadFile;
