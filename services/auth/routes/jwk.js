let express = require('express');
let router = express.Router();

import { getJwkStore } from '../core/helpers/jwk';

router.get('/generate', async (req, res) => {
  res.send(getJwkStore().toJWKS(false));
});

module.exports = router;
