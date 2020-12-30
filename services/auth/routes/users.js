import {Resend} from "../features/VerifyAuth/services";

let express = require('express');
let router = express.Router();

function hasChanged(newUser, oldUser) {
  let changed = false;
  let fields = {};
  if (newUser.email !== oldUser.email) {
    changed = 'email';
    fields.email = newUser.email;
  }

  if (newUser.phone !== oldUser.phone) {
    changed = changed ? 'both' : 'phone';
    fields = changed ? Object.assign(fields, { phone: newUser.phone }) : fields;
  }
  return {changed, fields};
}

router.post('/update', async function (req, res, next) {
  const body = req.body;

  if (body.table.schema === 'public' && body.table.name === 'users') {
    const oldUser = body.event.data.old;
    const newUser = body.event.data.new;
    const {changed, fields} = hasChanged(newUser, oldUser);

    if (changed) {
      const resend = new Resend(fields);
      return res.send({
        success: changed === 'both' ? await resend.resendBoth() :
          changed === 'email' ? await resend.resendEmail() :
            changed === 'phone' ? await resend.resendPhone() : false
      });
    }
  }

  return res.send({success: false});
});

module.exports = router;
