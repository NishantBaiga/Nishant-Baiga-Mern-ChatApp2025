import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { connectDB } from './lib/db.js';
import { ErrorHandler } from './middlewares/errorHandler.js';

// import routes 
import authRoutes from './routes/auth.route.js';

dotenv.config();
const app = express();

app.use(cors()); // Middleware to enable CORS
app.use(cookieParser()); // Middleware to parse cookies from incoming requests
app.use(express.json());   // Middleware to parse JSON data  
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data

app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);

app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(ErrorHandler);

app.listen(process.env.PORT, () => {
    connectDB();
    console.log(`Server is running on port ${process.env.PORT}`);
    }
);