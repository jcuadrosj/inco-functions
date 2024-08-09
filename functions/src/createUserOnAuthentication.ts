import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as log from 'firebase-functions/logger';
const cors = require('cors')({ origin: true });
import * as express from 'express';

const app = express();

app.use(cors);

export const generateUserDocument = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;


    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (userDoc.exists) {
        log.log(`User record already exists for UID: ${uid}`);
        return null;
    }
    try {
        const username = await generateRandomUsername();
        log.log(typeof(username),username)
        const userData = {
            isOptedIn: false,
            username: username,
            isFirstTimeUser: true
        };
        log.log(userData)
        const userDoc = await db.collection('users').doc(uid).set(userData);
        log.log(`User created for UID: ${uid}`);
        return userDoc;
    } catch (error) {
        log.error(`Error creating user record for UID ${uid}: `,error);
        return null;
    }
});


async function generateRandomUsername() {
    const url = `https://us-central1-inco-games.cloudfunctions.net/generateRandomUsername`;
    const response = await fetch(url);
    const data = await response.json();
    log.log(data)
    log.log(data.data)
    return data.data as string;
}