const  {MongoClient}  = require('mongodb')

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let db = null

function run() {
    try {
        db = client.db(process.env.MONGODB_NAME);
        return db
    } catch (error) {
        console.log('Failed to connect to MongoDB', error)
    }
}

function getDB() {
    if (!db) return run()
    return db
}

module.exports = {getDB}