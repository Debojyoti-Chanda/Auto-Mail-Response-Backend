// controllers/emailResponseController.mjs
import { google } from "googleapis";
import openai from "../config/openaiConfig.mjs";
import oAuth2Client from "../config/googleConfig.mjs";
import genAI from "../config/geminiConfig.mjs";

// Function to extract email addresses
function extractEmailAddress(str) {
  const match = str.match(/<([^>]+)>/);
  return match ? match[1] : null;
}
// Function to extract names
function extractName(str) {
  const match = str.match(/^"?(.*?)"?\s*<.*>$/);
  return match ? match[1] : null;
}

function extractTextInsideAsterisks(text) {
  const regex = /\*\*(.*?)\*\*/g;
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

const generateAndSendResponses = (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).send("Not authenticated");
  }
  oAuth2Client.setCredentials(req.session.tokens);

  const emails = req.body;
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const responsePromises = emails.messages.map((email) => {
    const bodyText = email.body.replace(/<[^>]*>?/gm, "");
    const senderEmail = extractEmailAddress(email.sender);
    const receiverEmail = extractEmailAddress(email.reciever);
    // Extracting sender and receiver names
    const senderName = extractName(email.sender);
    const receiverName = extractName(email.reciever);
    // OPENAI Model
    return openai.chat.completions
      .create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Respond to this email:\n\nSubject: ${email.subject}\n from:${receiverName} \n${bodyText} \n to:${senderName}`,
          },
        ],
        max_tokens: 150,
      })
      .then((response) => {
        const replyText = response.data.choices[0].text.trim();
        const rawMessage = [
          `From: ${receiverEmail}`,
          `To: ${senderEmail}`,
          `Subject: Re: ${email.subject}`,
          "",
          replyText,
        ].join("\n");
        console.log(rawMessage + "--- raw message ---");
        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        return gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });
      })
      .catch((error) => {
        throw new Error(
          `Error generating response for email with ID ${email.id}: ${error.message}`
        );
      });
  });
  //

  Promise.all(responsePromises)
    .then(() => {
      res.send("Responses sent successfully");
    })
    .catch((error) => {
      res.status(400).send(`Error sending responses: ${error.message}`);
    });
};

const generateAndSendResponsesByGoogle = (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).send("Not authenticated");
  }
  oAuth2Client.setCredentials(req.session.tokens);

  const emails = req.body;
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const responsePromises = emails.messages.map((email) => {
    const bodyText = email.body.replace(/<[^>]*>?/gm, "");
    const senderEmail = extractEmailAddress(email.sender);
    const receiverEmail = extractEmailAddress(email.reciever);
    // Extracting sender and receiver names
    const senderName = extractName(email.sender);
    const receiverName = extractName(email.reciever);
    // Gemini model
    model
      .generateContent(
        `Respond to this email:\n\nSubject: ${email.subject}\n from:${receiverName} \n${bodyText} \n to:${senderName} `
      )
      .then((res) => {
        return res.response;
      })
      .then((response) => {
        const text = response.text();
        const rawMessage = [
          `From: ${receiverEmail}`,
          `To: ${senderEmail}`,
          `Subject: Re: ${email.subject}`,
          "",
          text,
        ].join("\n");

        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        return gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });
      })
      .catch((error) => {
        throw new Error(
          `Error generating response for email with ID ${email.id}: ${error.message}`
        );
      });

    //
  });
  Promise.all(responsePromises)
    .then(() => {
      res.send("Responses sent successfully");
    })
    .catch((error) => {
      res.status(400).send(`Error sending responses: ${error.message}`);
    });
};

const labelEmailsByContent = (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).send("Not authenticated");
  }
  oAuth2Client.setCredentials(req.session.tokens);

  const emails = req.body;
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const labelPromises = emails.messages.map((email) => {
    const bodyText = email.body.replace(/<[^>]*>?/gm, "");
    // console.log(bodyText);
    // Use Gemini model to generate label
    return model
      .generateContent(
        `Classify this email :\n\nSubject: ${email.subject}\nBody: ${bodyText} from  Work,Personal and answer in either Work or Personal`
      )
      .then((res) => {
        return res.response;
      })
      .then((response) => {
        console.log(response.text());
        const label = extractTextInsideAsterisks(response.text());

        // Check if label exists, if not create it
        return gmail.users.labels
          .list({ userId: "me" })
          .then((labelsResponse) => {
            const labels = labelsResponse.data.labels;
            let labelId = labels.find((lbl) => lbl.name === label)?.id;

            if (!labelId) {
              return gmail.users.labels
                .create({
                  userId: "me",
                  requestBody: {
                    name: label,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                  },
                })
                .then((newLabelResponse) => {
                  labelId = newLabelResponse.data.id;
                  return labelId;
                });
            }
            return labelId;
          })
          .then((labelId) => {
            // Apply the label to the email
            return gmail.users.messages.modify({
              userId: "me",
              id: email.id,
              requestBody: {
                addLabelIds: [labelId],
              },
            });
          })
          .then(() => {
            console.log(
              `Label "${label}" applied to email with ID ${email.id}`
            );
          });
      })
      .catch((error) => {
        console.error(
          `Error labeling email with ID ${email.id}: ${error.message}`
        );
        throw new Error(
          `Error labeling email with ID ${email.id}: ${error.message}`
        );
      });
  });

  Promise.all(labelPromises)
    .then(() => {
      res.send("Emails labeled successfully");
    })
    .catch((error) => {
      res.status(400).send(`Error labeling emails: ${error.message}`);
    });
};

export default {
  generateAndSendResponses,
  generateAndSendResponsesByGoogle,
  labelEmailsByContent,
};
