require('dotenv-flow').config();
let express = require('express');
let router = express.Router();

import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as VKontakteStrategy } from 'passport-vkontakte';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import passport from 'passport';

import { Google } from '../features/NetworkAuth/services';
import { Facebook } from '../features/NetworkAuth/services';
import { VKontakte } from '../features/NetworkAuth/services';

const facebook = new Facebook();
const google = new Google();
const vKontakte = new VKontakte();

passport.use(new FacebookStrategy(facebook.options(),
  async function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(profile);
    return facebook.callback(profile, done);
  }
));

passport.use(new GoogleStrategy(google.options(),
  async function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(profile);
    return google.callback(profile, done);
  }
));

passport.use(new VKontakteStrategy(vKontakte.options(),
  async function(accessToken, refreshToken, params, profile, done) {
    console.log(accessToken);
    console.log(profile);
    console.log(params);
    return vKontakte.callback(profile, done);
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
  }
);


router.get('/vkontakte',
  passport.authenticate('vkontakte'));

router.get('/vkontakte/callback',
  passport.authenticate('vkontakte', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

module.exports = {
  router,
  passport,
};
