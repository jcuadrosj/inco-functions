/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

admin.initializeApp();

import { updateLeaderboardOnScoreSubmission } from './updateLeaderboardOnScoreSubmission';
import { updateLeaderboardOnUsernameUpdate } from './updateLeaderboardOnUsernameUpdate';
import { generateRandomUsername } from './generateRandomUserName';
import { generateUserDocument } from './createUserOnAuthentication';
import { updateUsername } from './updateUsernameWithUniqueness';



export const myFunction = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

export { generateUserDocument };
export { updateLeaderboardOnScoreSubmission };
export { updateLeaderboardOnUsernameUpdate };
export { generateRandomUsername };
export { updateUsername };
