import { spawn } from "child_process";

type Status = 'ERROR' | 'OK' | 'END';

export function sendMessage(message, status: Status = 'OK') {
  console.log('message: ' + message + 'status :' + status)
}

export function execute(command: string, callback = (hasError) => { }, step = 0) {
  const _command = spawn('bash')
  let hasError = false
  _command.stdin.end(command)

  _command.once('exit', code => {
    if (code == 0) {

      if (callback && typeof callback == 'function')
        callback(hasError)
    }
  });
  _command.stdout.on('data', (data) => {
    let str = new TextDecoder().decode(data);
    sendMessage(str)
  })
  _command.stdout.on('error', (data) => {
    sendMessage(data)
    hasError = true
    if (hasError) {
      throw new Error('error')
    }
  })
  _command.stderr.on('error', (data) => {
    sendMessage(data)
    hasError = true
    if (hasError) {
      throw new Error('error')
    }
  })
  _command.stderr.on('data', (data) => {
    let str = new TextDecoder().decode(data);
    sendMessage(str)
    if (hasError) {
      throw new Error('error')
    }
  })
  _command.on('error', (err) => {
    sendMessage(err)
    hasError = true
    if (hasError) {
      throw new Error('error')
    }
  })

}

export const reloadServer = (req, res, next) => {
  execute('cd ../server && docker-compose restart hasura-auth');
  res.end();
};
