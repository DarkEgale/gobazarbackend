import app from './app.js';
import ConnectDB from './config/db.js';






await ConnectDB();

app.listen(5000, () => {
    console.log("server is running on port 5000")
})