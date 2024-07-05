// controllers/googleController.mjs
import oAuth2Client, {SCOPES , gmailAuthUrl ,getGmailToken ,getGmailClient } from "../config/googleConfig.mjs";
import { google } from "googleapis";

const getAuthUrl = (req, res) => {
  const url = gmailAuthUrl;
  res.redirect(url);
};

const handleOAuth2Callback = async (req, res) => {
  const { code } = req.query;
  try {
    const token = await getGmailToken(code);
    req.session.tokens = token;
    res.send("Authentication successful! You can now close this tab.");
  } catch (error) {
      res.status(400).send(`Error during authentication: ${error.message}`);
  };
};

const getEmails = (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).send("Not authenticated");
  }
  oAuth2Client.setCredentials(req.session.tokens);

  const gmail = getGmailClient();
  const { pageToken } = req.query;

  // Retrieve the last 1 messages or the next page if pageToken is provided
  const listParams = {
    userId: "me",
    maxResults: 1,
  };

  if (pageToken) {
    listParams.pageToken = pageToken;
  }

  gmail.users.messages
    .list(listParams)
    .then((response) => {
      const messages = response.data.messages || [];
      const messagePromises = messages.map((message) =>
        gmail.users.messages.get({ userId: "me", id: message.id })
      );

      return Promise.all(messagePromises).then((fullMessages) => {
        const emailData = fullMessages.map((msg) => {
          const payload = msg.data.payload;
          let body = "";
          let sender = "";
          let reciever = "";
          let subject = "";
          // Extract the sender's email from the headers
          const headers = payload.headers;
          headers.forEach((header) => {
            if (header.name === "From") {
              sender = header.value;
            }
            if (header.name === "To") {
              reciever = header.value;
            }
            if (header.name === "Subject") {
              subject = header.value;
            }
          });
          if (payload.parts) {
            payload.parts.forEach((part) => {
              if (part.mimeType === "text/plain") {
                body = Buffer.from(part.body.data, "base64").toString("utf-8");
              } else if (part.mimeType === "text/html") {
                body = Buffer.from(part.body.data, "base64").toString("utf-8");
              }
            });
          } else {
            body = Buffer.from(payload.body.data, "base64").toString("utf-8");
          }

          return {
            id: msg.data.id,
            threadId: msg.data.threadId,
            snippet: msg.data.snippet,
            body,
            sender, // Include the sender's email in the response
            reciever,
            subject,
          };
        });

        res.send({
          messages: emailData,
          nextPageToken: response.data.nextPageToken,
        });
      });
    })
    .catch((error) => {
      res.status(400).send(`Error retrieving emails: ${error.message}`);
    });
};



export default { getAuthUrl, handleOAuth2Callback, getEmails };
