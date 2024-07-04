// googleConfig.mjs
import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
  '546394500474-f4ea91ole8v5vur689ja90qudsmeaj9i.apps.googleusercontent.com',
  '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',
  'http://localhost:8080/oauth2callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
];

export default oAuth2Client;
export { SCOPES };