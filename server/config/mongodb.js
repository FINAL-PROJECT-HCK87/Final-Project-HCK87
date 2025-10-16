import { MongoClient } from 'mongodb';

const uri = process.env.URI_MONGODB;
const client = new MongoClient(uri);
let db = null

function run() {
    try {
        db = client.db('Melodix');
        return db
    } catch (error) {
        console.log('Failed to connect to MongoDB', error)
    }
}

export function getDB() {
    if (!db) return run()
    return db
}