// app.js
const express = require('express');
const session = require('express-session');
const dotenv = require("dotenv");
const googleRoutes = require('./routes/googleRoutes');
const app = express();



dotenv.config();//This will load the variables from your .env file into process.env

// Configure session middleware
const SESSION_SECRET = process.env.SESSION_SECRET;
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
  }));


app.use('/', googleRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server is running on http://localhost:8080');
});
