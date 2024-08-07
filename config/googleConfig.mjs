// config/googleConfig.mjs
import { google } from 'googleapis';
import dotenv from 'dotenv'; // Load dotenv package
dotenv.config()

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost:8080/oauth2callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];


const gmailAuthUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

const getGmailToken = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  return tokens;
};

const getGmailClient = () => {
  return google.gmail({ version: 'v1', auth: oAuth2Client });
};

export default oAuth2Client;
export { SCOPES , gmailAuthUrl ,getGmailToken ,getGmailClient};