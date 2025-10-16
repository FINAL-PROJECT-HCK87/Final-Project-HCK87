module.exports = class Controller {
  static getCollection (){
    const db = getDB()
    const collection = db.collection('songs')
    return collection
  }
  static async findAll(req, res, next) {
    try {
      const collection = this.getCollection();
      const data = await collection.find().toArray();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async findOrCreateSong(req, res, next) {
    try {
      const { isrc, title, artist, album, release_date } = req.body;
      const collection = this.getCollection();
      const data = await collection.findOne({ isrc: req.body.isrc });
        if (!data) {
            const newSong = { isrc, title, artist, album, release_date };
            const result = await collection.insertOne(newSong);
            return res.status(201).json(result.ops[0]);
        }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }


}
