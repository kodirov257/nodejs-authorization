let express = require('express');
let router = express.Router();
import has from 'lodash/has';

import { setEnvironment } from '../core/helpers/config-loader';

/* GET home page. */
router.get('/', async (req, res) => {
  return res.send({ title: 'Express' });
});

router.get('/test', async (req, res) => {
  res.status(200);
  return res.send({ title: 'Test' });
});

const services = [
  'BasicAuth',
  'VerifyAuth',
  'NetworkAuth',
];

router.post('/hasura-event', async (req, res) => {
  const body = req.body;
  const newData = body.event.data.new;
  const value = newData.value;
  console.log(body.table.schema);
  console.log(body.table.name);
  console.log(newData.key);
  console.log(newData);

  if (body.table.schema === 'public' && body.table.name === 'settings' && newData.key === 'auth') {
    try {
      if (!has(value, 'service')) {
        throw new Error('No service provided.');
      }

      if (!services.includes(value.service)) {
        throw new Error('Wrong service provided.');
      }

      setEnvironment(value);

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
  }
});

module.exports = router;
