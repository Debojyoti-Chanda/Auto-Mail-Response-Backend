// routes/googleRoutes.mjs
import express from 'express';
import googleController from '../controllers/googleController.mjs';
import emailResponseController from '../controllers/emailResponseController.mjs';

const router = express.Router();

router.get('/auth/google', googleController.getAuthUrl);
router.get('/oauth2callback', googleController.handleOAuth2Callback);
router.get('/emails', googleController.getEmails);   //http://localhost:8080/emails?pageToken=YOUR_NEXT_PAGE_TOKEN
router.post('/generate-responses', emailResponseController.generateAndSendResponsesByGoogle);
router.post('/labelEmails',emailResponseController.labelEmailsByContent)

export default router;
