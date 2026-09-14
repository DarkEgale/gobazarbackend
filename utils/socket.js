import { Server } from 'socket.io';
// verifyToken has a DEFAULT export (helpers/verifyToken.js)
import verifyToken from '../helpers/verifyToken.js';
import User from '../models/user.model.js';

// Socket.io singleton — initialized once from server.js.
// Rooms:
//   user_<userId>  → every connection of that customer
//   admins         → every admin connection
// Events:
//   notification  → real-time toast notifications
//   chat:message  → customer support chat messages

let io = null;

const parseCookie = (cookieHeader = '') => {
    const cookies = {};
    cookieHeader.split(';').forEach((pair) => {
        const index = pair.indexOf('=');
        if (index === -1) return;
        cookies[pair.slice(0, index).trim()] = decodeURIComponent(
            pair.slice(index + 1).trim(),
        );
    });
    return cookies;
};

export const initSocket = (httpServer, origin) => {
    io = new Server(httpServer, {
        cors: { origin, credentials: true },
    });

    // authenticate the handshake with the accessToken cookie
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookie(socket.handshake.headers.cookie || '');
            const token = cookies.accessToken;
            if (!token) return next(new Error('Unauthorized: no token'));

            const decode = verifyToken(token);
            const user = await User.findById(decode.userId).select('role');
            if (!user) return next(new Error('Unauthorized: user not found'));

            socket.data.userId = String(user._id);
            socket.data.isAdmin = user.role === 'admin';
            next();
        } catch {
            next(new Error('Unauthorized: invalid token'));
        }
    });

    io.on('connection', (socket) => {
        socket.join(`user_${socket.data.userId}`);
        if (socket.data.isAdmin) {
            socket.join('admins');
        }
    });

    return io;
};

export const getIO = () => io;

// send a notification to one customer
export const emitToUser = (userId, event, payload) => {
    if (io) io.to(`user_${String(userId)}`).emit(event, payload);
};

// broadcast to every connected admin
export const emitToAdmins = (event, payload) => {
    if (io) io.to('admins').emit(event, payload);
};

export default { initSocket, getIO, emitToUser, emitToAdmins };