import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as log from 'firebase-functions/logger';
const cors = require('cors')({ origin: true })
import * as express from 'express';

const app = express();

app.use(cors);

const db = admin.firestore();

async function getRandomTerm(docId: string): Promise<string> {

    if (!docId) {
    
        log.error('The function must be called with one argument "docId".');
        return ""
    }
    try {
        const doc = await db.collection('terms').doc(docId).get();
        if (!doc.exists) {
            throw new Error('The document does not exist.');
        }
        const terms = doc?.data()?.terms;
        if (!Array.isArray(terms) || terms.length === 0) {
            throw new Error('No terms found in the document.');
        }
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        return randomTerm;
    } catch (error) {
        log.error(`Error getting username from ${docId}: ${error}`);
        return ""
    }
}

export const generateRandomUsername = functions.https.onRequest(async (req, res) => {
    cors(req, res,async() => {
        try {
            let unique = false;
            let username = "";
            let pride = await getRandomTerm('pride');
            let tech = await getRandomTerm('tech');
            let animal = await getRandomTerm('animal');
            let randomDigits = Math.ceil(Math.random() * 9999); // Three-digit random number
            
            do {
                username = `${pride}${tech}${animal}${randomDigits}`;
                
                let usernameQuery = await db.collection('users')
                                            .where('username', '==', username)
                                            .limit(1)
                                            .get();
                unique = usernameQuery.empty;
                randomDigits += 1;
            } while (!unique);
            res.status(200).send({ username: username});
        } catch (error) {
            log.error('Error generating username:', error);
            res.status(500).send({ 'data': 'Internal Server Error'});
        }
    })
});