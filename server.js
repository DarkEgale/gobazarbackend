import http from 'http';
import app from './app.js';
import ConnectDB from './config/db.js';
import { initSocket } from './utils/socket.js';






await ConnectDB();

const server = http.createServer(app);
initSocket(server, process.env.CLIENT);

server.listen(5000, () => {
    console.log("server is running on port 5000")
})