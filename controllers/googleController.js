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
  
const getEmails = (req, res) => {
    if (!req.session.tokens) {
      return res.status(401).send('Not authenticated');
    }
    oAuth2Client.setCredentials(req.session.tokens);
  
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const { pageToken } = req.query;
  
    // Retrieve the first 2 messages or the next page if pageToken is provided
    const listParams = {
      userId: 'me',
      maxResults: 2,
    };
    
    if (pageToken) {
      listParams.pageToken = pageToken;
    }
  
    gmail.users.messages.list(listParams)
      .then(response => {
        const messages = response.data.messages || [];
        const messagePromises = messages.map(message =>
          gmail.users.messages.get({ userId: 'me', id: message.id })
        );
  
        return Promise.all(messagePromises)
          .then(fullMessages => {
            const emailData = fullMessages.map(msg => {
              const payload = msg.data.payload;
              let body = '';
  
              if (payload.parts) {
                payload.parts.forEach(part => {
                  if (part.mimeType === 'text/plain') {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                  } else if (part.mimeType === 'text/html') {
                    body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                  }
                });
              } else {
                body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
              }
  
              return {
                id: msg.data.id,
                threadId: msg.data.threadId,
                snippet: msg.data.snippet,
                body,
              };
            });
  
            res.send({
              messages: emailData,
              nextPageToken: response.data.nextPageToken,
            });
          });
      })
      .catch(error => {
        res.status(400).send(`Error retrieving emails: ${error.message}`);
      });
  };




module.exports = {
    getAuthUrl,
    handleOAuth2Callback,
    getEmails,
};
  