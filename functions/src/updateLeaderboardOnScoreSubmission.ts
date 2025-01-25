import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const cors = require('cors')({ origin: true })
import * as express from 'express';

const app = express();

app.use(cors);

interface ScoreData {
    userId: string;
    gameId: string;
    score: number;
}

/**
 * 
 */
export const updateLeaderboardOnScoreSubmission = functions.firestore
    .document("scores/{scoreId}")
    .onCreate(async (snap, context) => {
        try {
            const newScore = snap.data() as ScoreData;
            const { userId, gameId, score } = newScore;

            const leaderboardRef = admin.firestore()
                .collection("leaderboards")
                .doc(gameId)
                .collection("userScores")
                .doc(userId);

                // TODO: We need to figure out how to update users table to 
                // add gameId to gamesPlayed field.

            await admin.firestore().runTransaction(async (transaction:any) => {
                const lbDoc = await transaction.get(leaderboardRef);
                const existingScore = lbDoc.data().totalScore;
                const newTotalScore = lbDoc.exists && (typeof existingScore === 'number') && !isNaN(existingScore) ? existingScore + score : score;

                transaction.set(leaderboardRef, {
                    totalScore: newTotalScore,
                    lastSubmission: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            });
        } catch (error) {
            console.error("Failed to update leaderboard on score submission", error);
            throw new functions.https.HttpsError('unknown', 'Failed to process leaderboard update', error);
        }
    });
