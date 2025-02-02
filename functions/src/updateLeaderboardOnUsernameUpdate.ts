import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const cors = require('cors')({ origin: true })
import * as express from 'express';
import { GAME_NAME } from "./firebase/firebase-constants";


const app = express();

app.use(cors);

const { log } = require("firebase-functions/logger");

/**
 * Cloud Function to Update Username on Leaderboard Entries.
 * 
 * This Cloud Function is triggered whenever a document in the "users" collection is updated.
 * Specifically, it monitors changes to the username field of the user document. If the username
 * is changed, this function updates the corresponding entry in the "leaderboards" collection to
 * reflect the new username. This ensures that the leaderboard always displays the current username
 * of each user.
 * 
 * @param {functions.Change<functions.firestore.DocumentSnapshot>} change - Object representing the state of the document before and after the update.
 * @param {functions.EventContext} context - Object containing metadata about the event.
 * 
 * @returns {Promise<null>} - A promise that resolves to null.
 * 
 * The function performs the following steps:
 * 1. Extracts the user data before and after the update from the `change` object.
 * 2. Logs the user ID and the new username.
 * 3. Checks if the username has changed; if not, it logs a message and exits.
 * 4. If the username has changed, it retrieves a reference to the user's entry in the "leaderboards" collection.
 * 5. Executes a Firestore transaction to update the username in the leaderboard entry. If the entry does not exist, it logs a message.
 * 6. Logs a success message if the transaction completes successfully.
 * 7. Catches and logs any errors that occur during the transaction.
 * 
 * This function is essential for maintaining consistency between the user data and the leaderboard
 * data in a Firestore database.
 */
export const updateLeaderboardOnUsernameUpdate = functions.firestore
    .document("/users/{userId}")
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const { userId } = context.params;
        
        // Ensure data exists
        if (!beforeData || !afterData) {
            log("No data found in the document.");
            return null;
        }

        log('Updating user:', userId, 'with username:', afterData.username);

        // Check if the username has changed
        // if ( (beforeData.username === afterData.username) && (beforeData.linkedInURL === afterData.linkedInURL)) {
        //     log("Username and profile URL have not changed, no update needed.");
        //     return null;
        // }
        if (beforeData.username === afterData.username) {
            log("Username has not changed, no update needed.");
            return null;
        }

        const leaderboardRef = admin.firestore()
            .collection("leaderboards")
            .doc(GAME_NAME)
            .collection("userScores")
            .doc(userId);

        try {
            await admin.firestore().runTransaction(async (transaction) => {
                const doc = await transaction.get(leaderboardRef);
                if (!doc.exists) {
                    log(`No leaderboard entry found for user: ${userId}`);
                }

                transaction.set(leaderboardRef, {
                    username: afterData.username,
                    // linkedInURL: afterData.linkedInURL
                }, { merge: true });
            });
            log(`Leaderboard updated successfully for user: ${userId}`);
            return null;
        } catch (error) {
            log('Error updating leaderboard for user ${userId}:', error);
            return null;
        }
    });
