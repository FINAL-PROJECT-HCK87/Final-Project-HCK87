module.exports = class Controller {
  static async findAll(req, res, next) {
    try {
      const db = req.app.locals.db;
      const data = await db.collection('songs').find().toArray();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}
