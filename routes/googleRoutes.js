// routes/googleRoutes.js

const express = require('express');
const router = express.Router();
const googleController = require('../controllers/googleController');

router.get('/auth/google', googleController.getAuthUrl);
router.get('/oauth2callback', googleController.handleOAuth2Callback);
router.get('/emails', googleController.getEmails);   //http://localhost:8080/emails?pageToken=YOUR_NEXT_PAGE_TOKEN

module.exports = router;