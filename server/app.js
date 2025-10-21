if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const router = require('./routes');
const errorHandler = require('./errorHandler');
const app = express();

app.use(require('cors')());
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase URL-encoded payload limit

console.log('masuk');

app.use(router);

app.use(errorHandler);

module.exports = app;
