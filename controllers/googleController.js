// controllers/googleController.js

const oAuth2Client = require('../config/googleConfig');
const { google } = require('googleapis');

const getAuthUrl = (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
};

const handleOAuth2Callback = (req, res) => {
    const { code } = req.query;
    oAuth2Client.getToken(code)
      .then(({ tokens }) => {
        oAuth2Client.setCredentials(tokens);
        // Save tokens in session
        req.session.tokens = tokens;
  
        res.send('Authentication successful! You can now close this tab.');
      })
      .catch(error => {
        res.status(400).send(`Error during authentication: ${error.message}`);
      });
};
  




module.exports = {
    getAuthUrl,
    handleOAuth2Callback,
};
  