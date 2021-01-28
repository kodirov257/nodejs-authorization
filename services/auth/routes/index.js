let express = require('express');
let router = express.Router();
import has from 'lodash/has';
import path from 'path';
import fs from 'fs';

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

router.get('/abilities', async (req, res) => {
  if (req.query.type !== undefined && services.includes(req.query.type)) {
    const fileName = path.resolve(__dirname, '../env.json');
    const environment = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    const serviceName = req.query.type.split('Auth')[0].toLowerCase();
    const templateEnv = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../env.${serviceName}.json`), 'utf-8'));

    let result = {};
    for (const value in templateEnv) {
      if (environment[value]) {
        result[value] = environment[value];
      } else {
        result[value] = templateEnv[value];
      }
    }

    result.service = req.query.type;
    return res.send({
      data: result,
    });
  }

  return res.send({
    data: services,
  });
});

module.exports = router;
