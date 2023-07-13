require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoString = process.env.DATABASE_URL;
const router = express.Router()

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})
const app = express();
app.use(express.json());
app.use(cors());

// app.use(cors({
//   origin: 'http://localhost:3001'
// }));
app.use(bodyParser.json());
app.options('*',cors())
app.use('/api', require('./routes/route').router);
app.use('/api', require('./routes/userRoutes').router);

// Add a catch-all route for API not found
app.use((req, res) => {
    res.status(404).json({ message: "API not found" });
  });

app.listen(process.env.PORT || 5000,  () => {
    console.log(`Server Started at http://${process.env.PORT}`)
})

// app.listen(process.env.PORT, () => {
//     console.log(`Server Started at http://${process.env.hostnameLocal}:${process.env.PORT}`)
// })