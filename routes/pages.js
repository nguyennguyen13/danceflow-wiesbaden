const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const messagesPath = path.join(__dirname, '..', 'data', 'messages.json');

router.get('/', (req, res) => {
  res.render('index');
});

module.exports = router;