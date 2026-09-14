import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import auth from './routes/auth/auth.js';
import product from './routes/product/product.js';
import wishRoute from './routes/wish/wishRoute.js'
import order from './routes/order/order.js';
import userRoute from './routes/user/user.js';
import reviewRoute from './routes/review/review.js';
import returnRoute from './routes/return/returnRoute.js';
import settingRoute from './routes/setting/settingRoute.js';
import chatRoute from './routes/chat/chatRoute.js';
import logRoute from './routes/log/logRoute.js';
import serverHealthRoute from './routes/health/serverHealthRoute.js';
import healthCheck from './routes/health/healthCheck.js'
const app = express()
dotenv.config()
app.use(express.json())
app.use(cookieParser())
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}))
app.use('/auth', auth)
app.use('/api/products', product)
app.use('/api', wishRoute)
app.use('/api/order', order)
app.use('/api/users', userRoute)
app.use('/api/reviews', reviewRoute)
app.use('/api/return', returnRoute)
app.use('/api/settings', settingRoute)
app.use('/api/chat', chatRoute)
app.use('/api/logs', logRoute)
app.use('/api/server-health', serverHealthRoute)
app.use('/api', healthCheck)




export default app;