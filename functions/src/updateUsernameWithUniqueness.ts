import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// The main function to update the username
export const updateUsername = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated
    if (!context.auth) {
        return { success: false, message: "Not authenticated" };
    }

    const newUsername = data.username;
    const userId = context.auth.uid;

    // Validate input
    if (typeof newUsername !== 'string' || newUsername.length === 0) {
        return { success: false, message: "Invalid username" };
    }

    try {
        // Check if the username is already in use
        const usersSnapshot = await db.collection('users').where('username', '==', newUsername).get();

        if (!usersSnapshot.empty) {
            return { success: false, message: "Username is already in use" };
        }

        // Update the user's username
        await db.collection('users').doc(userId).update({
            username: newUsername
        });

        return { success: true, message: "Username updated successfully" };
    } catch (error) {
        console.error("Error updating username: ", error);
        return { success: false, message: "Internal error occurred" };
    }
});