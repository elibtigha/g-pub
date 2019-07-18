require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const request = require('request');
const qs = require('querystring');
const url = require('url');
const randomString = require('randomstring');

const port = process.env.PORT || 3000;
const redirect_uri = process.env.HOST + '/redirect';
// const redirect_uri = process.env.HOST;

app.use(express.static('views'));
app.use(
  session({
    secret: randomString.generate(),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/login', (req, res, next) => {
  req.session.csrf_string = randomString.generate();
  const githubAuthUrl =
    'https://github.com/login/oauth/authorize?' +
    qs.stringify({
      client_id: 'Iv1.73333a21c7762914',
      redirect_uri: redirect_uri,
      state: req.session.csrf_string,
      scope: 'repo'
    });
  res.redirect(githubAuthUrl);
});

app.all('/redirect', (req, res) => {
  console.log('Request sent by GitHub: ');
  console.log(req.query);
  const code = req.query.code;
  console.log(code)
  const returnedState = req.query.state;
  if (req.session.csrf_string === returnedState) {
    request.post(
      {
        url:
          'https://github.com/login/oauth/access_token?' +
          qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: '682e41bd037f58019255e1d0d432b53370d73e85',
            code: code,
            redirect_uri: redirect_uri,
            state: req.session.csrf_string,
            scope: 'repo'
          })
      },
      (error, response, body) => {
        // The response will contain your new access token
        // this is where you store the token somewhere safe
        // for this example we're just storing it in session
        console.log('Your Access Token: ');
        console.log(qs.parse(body));
        req.session.access_token = qs.parse(body).access_token;

        // Redirects user to /user page so we can use
        // the token to get some data.
        res.redirect('/user');
      }
    );
  } else {
    res.redirect('/');
  }
});

app.get('/user', (req, res) => {
  request.get(
    {
      url: 'https://api.github.com/user/repos',
      headers: {
        Authorization: 'token ' + req.session.access_token,
        'User-Agent': 'Login-App',
        'type': "all"

      }
    },
    (error, response, body) => {
      res.send(
        "<p>You're logged in! Here's all your repos on GitHub: </p>" +
          body +
          '<p>Go back to <a href="./">log in page</a>.</p>'
      );
    }
  );
});

app.listen(port, () => {
  console.log('Server listening at port ' + port);
});