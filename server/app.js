if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const router = require('./routes');
const errorHandler = require('./errorHandler');
const app = express();

app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('masuk');

app.use(router);

app.use(errorHandler);

module.exports = app;
