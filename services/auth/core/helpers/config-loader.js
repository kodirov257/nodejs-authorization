const path = require('path');
import fs from 'fs';

export const setEnvironment = (value) => {
  const data = JSON.stringify(value);
  const fileName = path.resolve(__dirname, '../../env.json');

  fs.writeFileSync(fileName, data);
  fs.chmodSync(fileName, '0666');
}
