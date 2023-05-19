import mongoose from 'mongoose';
import logger from '../Utils/Logger.js';

const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			logger.fatal('MongoDB URI not found');
			process.exit(1);
		}

		await mongoose.connect(process.env.MONGO_URI);

		logger.info('MongoDB connected...');
	} catch (error) {
		logger.fatal(error as string);
		process.exit(1);
	}
};

export default connectDB;
