const { MongoClient, ObjectId } = require('mongodb');

let db;
let client;

async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToDatabase();

// const fs = require('fs');

const recentUserActivity = new Map();

async function storeUserActivity(userId, activityType, timestamp, userName = null, details = '') {
  try {
    const activity = { _id: new ObjectId(), userName, timestamp, activityType, details };
    recentUserActivity.set(userId, activity);

    // Write activity to JSON file
    //  writeToJSON(activity);

    if (["Command Used", "Status Update"].includes(activityType) || ["Break", "Resume", "Follow Up"].includes(activityType)) {
      await saveRecentUserActivitiesToDatabase();
    }

    if (activityType === "Follow Up") {
      const startTimeActivity = recentUserActivity.get(userId);
      if (startTimeActivity) {
        const startTime = startTimeActivity.timestamp;
        const endTime = timestamp;
        const totalSeconds = Math.floor((endTime - startTime) / 1000);

        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');

        const formattedTime = `${hours}:${minutes}:${seconds}`;
        activity.details = formattedTime;
      }
    }
  } catch (error) {
    console.error('Error storing user activity data:', error);
  }
}

// function writeToJSON(activity) {
//   try {
//     const data = JSON.stringify(activity);
//     fs.appendFileSync('user_activity.json', data + '\n');
//   } catch (error) {
//     console.error('Error writing to JSON file:', error);
//   }
// }

async function saveRecentUserActivitiesToDatabase() {
  try {
    if (!db) {
      throw new Error('Database connection is not established');
    }

    const currentTime = new Date();
    const oneMinuteAgo = new Date(currentTime.getTime() - 1 * 60 * 1000);
    const activitiesToStore = [...recentUserActivity.values()].filter(
      (activity) => new Date(activity.timestamp) > oneMinuteAgo
    );

    const insertPromises = activitiesToStore.map(async (activity) => {
      const collectionName = activity.userName ? activity.userName.toLowerCase().replace(/[^a-z0-9_]/g, "_") : 'unknown_user';
      await db.collection(collectionName).insertOne(activity);
      recentUserActivity.delete(activity.userId);
    });

    await Promise.all(insertPromises);
  } catch (error) {
    console.error('Error storing recent user activity data:', error);
  }
}

async function updateUserStatus(userId, status, userName) {
  const timestamp = new Date();
  await storeUserActivity(userId, "Status Update", timestamp, userName, status);
}

async function startOfWork(userId, userName) {
  const startTime = new Date();
  await storeUserActivity(userId, "Start of Work", startTime, userName);
}

module.exports = {
  storeUserActivity,
  updateUserStatus,
  startOfWork,
};
