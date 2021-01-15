let express = require('express');
let router = express.Router();
import has from 'lodash/has';
import path from 'path';
import fs from 'fs';

/* GET home page. */
router.get('/', async (req, res) => {
  return res.send({ title: 'Express' });
});

router.get('/test', async (req, res) => {
  res.status(200);
  return res.send({ title: 'Test' });
});

const services = [
  'BaseAuth',
  'VerifyAuth',
];

router.post('/hasura-event', async (req, res) => {
  const body = req.body;

  try {
    if (!has(body, 'service')) {
      throw new Error('No service provided.');
    }

    if (!services.includes(body.service)) {
      throw new Error('Wrong service provided.');
    }

    if (Object.keys(body).length > 1) {
      throw new Error('Wrong parameters provided.');
    }

    const data = JSON.stringify(body);
    const fileName = path.resolve(__dirname, '../service.json');


    fs.writeFileSync(fileName, data);
    fs.chmodSync(fileName, '0666');

    return res.send({
      data: {
        'hasura-event': true,
      }
    });
  } catch (e) {
    return res.send({
      data: {
        'hasura-event': false,
        message: e.message,
      }
    });
  }
});

module.exports = router;
