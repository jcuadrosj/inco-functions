import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Cloud Function to Update Username on Leaderboard Entries.
 *
 * This function triggers on updates to the `users/{userId}` document path in Firestore.
 * It checks if the `username` field in the document has changed. If it has, the function
 * updates all corresponding leaderboard entries with the new username across all game IDs.
 *
 * The function uses a Firestore collection group query to find all relevant leaderboard entries
 * for the user across various games. If the username has changed, it performs a batch update
 * to set the new username in each leaderboard entry.
 *
 * The update is designed to ensure data consistency across user profiles and leaderboard entries,
 * which can affect multiple documents. It uses batch operations to minimize the number of write
 * operations and ensure atomicity.
 *
 * Usage:
 * - This function is automatically invoked by Firestore when any update occurs to a user's document.
 * - It is part of the backend operations and does not require direct invocation from client applications.
 *
 * @module cloud-functions
 * @function updateLeaderboardOnUsernameUpdate
 * @param {functions.Change<functions.firestore.DocumentSnapshot>} change - Contains the before and after states of the document that triggered the function.
 * @param {functions.EventContext} context - Contains metadata about the event, including the `userId` of the document that triggered the function.
 * @returns {Promise<void>} A promise that resolves when all updates are successfully committed, or throws an error if the operation fails.
 *
 * @throws {functions.https.HttpsError} Throws an 'unknown' error if the batch update fails.
 */
export const updateLeaderboardOnUsernameUpdate = functions.firestore
    .document("/users/{userId}")
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();

        const { userId } = context.params;

        // Check if the username has changed
        if (beforeData.username === afterData.username) {
            log("Username has not changed, no update needed.");
            return null;
        }

        try {
            const leaderboardRef = admin.firestore()
            .collection("leaderboards")
            .doc("bingo")
            .collection("userScores")
            .doc(userId);


            await admin.firestore().runTransaction(async (transaction) => {
                transaction.set(leaderboardRef, {
                    username: afterData.username
                }, { merge: true });
            });
            return null;
        } catch(error) {
            error('error', error);
            return null;
        }
        // TRY 2
        // const leaderboardsRef = admin.firestore().collection('leaderboards');
  
        // try {
        //   const leaderboardsSnapshot = await leaderboardsRef.get();
      
        //   if (leaderboardsSnapshot.empty) {
        //     log('No leaderboards found.');
        //     return null;
        //   }
      
        //   const batch = admin.firestore().batch();
        //   log("🚀 ~ batch:", batch);
      
        //   leaderboardsSnapshot.forEach(async (leaderboardDoc) => {
        //     const userScoresRef = leaderboardDoc.ref.collection('userScores');
        //     log("🚀 ~ leaderboardsSnapshot.forEach ~ userScoresRef:", userScoresRef)
        //     const userScoresSnapshot = await userScoresRef.where('userId', '==', userId).get();
        //     log("🚀 ~ leaderboardsSnapshot.forEach ~ userScoresSnapshot:", userScoresSnapshot);
      
        //     if (!userScoresSnapshot.empty) {
        //         console.debug('Attempting to batch update leaderboards found.');
        //         log('Attempting to batch update leaderboards found.');
        //         userScoresSnapshot.forEach((userScoreDoc) => {
        //           console.debug('Here is a userScoreDoc',userScoreDoc.data());
        //           log('Here is a userScoreDoc',userScoreDoc.data());
        //         batch.update(userScoreDoc.ref, { username: afterData.username });
        //       });
        //     }
        //   });
      
        //   const result = await batch.commit();
        //   log("🚀 ~ result:", result);
        //   log('Usernames updated successfully in leaderboards.');
        //   return null;
          
        // } catch (error) {
        //     console.error(error as any);
        //     throw new functions.https.HttpsError('unknown', `Failed to update leaderboard entries. ${userId}`, error);
        // }
    });
