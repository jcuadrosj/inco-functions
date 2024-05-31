import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as log from 'firebase-functions/logger';
import * as cors from 'cors';
import * as express from 'express'

const app = express()

app.use(cors)

const db = admin.firestore();

interface TermDocument {
  term: string;
}

async function getRandomTerm(collectionName: string): Promise<string> {
  const collectionRef = db.collection('terms').doc(collectionName).collection(collectionName);
  const snapshot = await collectionRef.get();
  const docs = snapshot.docs;
  if (docs.length === 0) {
    throw new Error(`No documents found in collection: ${collectionName}`);
  }
  const randomIndex = Math.floor(Math.random() * docs.length);
  const termDoc = docs[randomIndex].data() as TermDocument;
  return termDoc.term;
}

export const generateRandomUsername = functions.https.onRequest(async (req, res) => {
  try {
    const animal = await getRandomTerm('animal');
    const pride = await getRandomTerm('pride');
    const tech = await getRandomTerm('tech');
    const randomDigits = Math.floor(100 + Math.random() * 900); // Three-digit random number
    const username = `${pride}${tech}${animal}${randomDigits}`;
    res.status(200).send(username);
  } catch (error) {
    log.error('Error generating username:', error);
    res.status(500).send('Internal Server Error');
  }
});