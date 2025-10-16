const { ObjectId } = require("mongodb")
const { getDB } = require("../config/mongodb")


class Controller {
  static getCollection (){
    // console.log("<<<<<<<< GETDB")
    const db = getDB()
    const collection = db.collection('songs')
    return collection
  }
  static async findAll(req, res, next) {
    try {
      // const collection = this.getCollection();
      // const data = await collection.find().toArray();
      res.status(200).json({message : "AKU JALAN"});
    } catch (error) {
      next(error);
    }
  }

  static async findOrCreateSong(req, res, next) {
    try {
      // console.log(req.body)
      const { isrc, title, artist, album, cover_art_url, duration_ms , spotify_url, apple_music_url, preview_url, release_date , genre } = req.body;
      const collection = Controller.getCollection();
      // console.log(collection, '>>>>>>>>>>>>>>')
      const data = await collection.findOne({ isrc: req.body.isrc });
        if (!data) {
            const newSong = { isrc, title, artist, album, release_date, cover_art_url, duration_ms, spotify_url, apple_music_url, preview_url, genre };
            const result = await collection.insertOne(newSong);
            return res.status(201).json(result.ops[0]);
        }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }


}


module.exports = Controller
