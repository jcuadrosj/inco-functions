import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const cors = require('cors')({ origin: true });
import * as express from 'express';
import * as log from 'firebase-functions/logger';
const app = express();
app.use(cors);
interface ScoreData {
    userId: string;
    gameId: string;
    score: number;
}

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
            await admin.firestore().runTransaction(async (transaction:any) => {
                let lbDoc = await transaction.get(leaderboardRef);
                const existingScore = lbDoc.data()?.totalScore;
                const newTotalScore =  existingScore && (typeof existingScore === 'number') && !isNaN(existingScore) ? existingScore + score : score;
                log.info("newTotalScore1",newTotalScore,"existingScore",existingScore)
                if (lbDoc.exists) {
                    transaction.set(leaderboardRef, {
                        totalScore: newTotalScore,
                        lastSubmission: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                } else {
                    let userRef = admin.firestore().collection("users").doc("userId");
                    const userDoc = await transaction.get(userRef)
                    const username = userDoc.data()?.username;
                    log.info("newTotalScore2",newTotalScore,"existingScore",existingScore)
                    log.info("userDoc",userDoc,"userRef",userRef,"username",username)
                    transaction.set(leaderboardRef, {
                        totalScore: newTotalScore,
                        lastSubmission: admin.firestore.FieldValue.serverTimestamp(),
                        username: username,
                    }, { merge: true });
                }
            });
        } catch (error) {
            console.error("Failed to update leaderboard on score submission", error);
            throw new functions.https.HttpsError('unknown', 'Failed to process leaderboard update', error);
        }
    });