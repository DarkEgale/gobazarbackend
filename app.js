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
const app = express()
dotenv.config()
app.use(express.json())
app.use(cookieParser())
app.use(helmet()) // Security headers (X-Frame-Options, CSP, HSTS ইত্যাদি)
app.use(cors({
    origin: process.env.CLIENT,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}))
app.use('/auth', auth)
app.use('/api/products', product)
app.use('/api', wishRoute)
app.use('/api/order', order)
app.use('/api/users', userRoute)
app.use('/api/reviews', reviewRoute)




export default app;