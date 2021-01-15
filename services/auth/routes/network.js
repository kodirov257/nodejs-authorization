import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import passport from 'passport';
require('dotenv-flow').config();
let express = require('express');
let router = express.Router();

import { Google } from '../features/NetworkAuth/services';
import { Facebook } from '../features/NetworkAuth/services';

const facebook = new Facebook();
const google = new Google();

passport.use(new FacebookStrategy(facebook.options(),
  async function(accessToken, refreshToken, profile, done) {
    return facebook.callback(profile, done);
  }
));

passport.use(new GoogleStrategy(google.options(),
  async function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
    return google.callback(profile, done);
  }
));

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/',
  failureRedirect: '/login' }));


router.get('/google',
  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

module.exports = {
  router,
  passport,
};
