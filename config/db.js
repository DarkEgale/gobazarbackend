import mongoose from 'mongoose';

const dburl = process.env.MONGODB;
const ConnectDB = async () => {
    try {
        mongoose.connect(dburl)
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.log("MongoDB connection failed");
        console.log(err);
    }
}

export default ConnectDB;