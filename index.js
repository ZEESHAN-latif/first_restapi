require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mongoString = process.env.DATABASE_URL;
const router = express.Router()
const allowedOrigins = ['https://firstrestapi-production.up.railway.app', 'http://localhost:5000'];

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
//   origin: 'https://firstrestapi-production.up.railway.app:6184'
// }));

app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    })
  );

app.use('/api', require('./routes/route').router);
app.use('/api', require('./routes/userRoutes').router);

app.listen(process.env.PORT || 5000,  () => {
    console.log(`Server Started at http://${process.env.PORT}`)
})

// app.listen(process.env.PORT, () => {
//     console.log(`Server Started at http://${process.env.hostnameLocal}:${process.env.PORT}`)
// })