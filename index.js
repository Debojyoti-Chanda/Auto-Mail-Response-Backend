// index.mjs
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import googleRoutes from './routes/googleRoutes.mjs';

dotenv.config(); // This will load the variables from your .env file into process.env
const app = express();

app.use(bodyParser.json());
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