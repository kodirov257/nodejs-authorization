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

  if (body.table.schema === 'public' && body.table.name === 'settings') {
    try {
      if (!has(body, 'service')) {
        throw new Error('No service provided.');
      }

      if (!services.includes(body.service)) {
        throw new Error('Wrong service provided.');
      }

      await setEnvironment(body.event.data.new.value);

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
