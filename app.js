require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const request = require('request');
const qs = require('querystring');
const url = require('url');
const randomString = require('randomstring');
// const shell = require('shelljs');
const JSONObject = require('JSONObject');


const port = process.env.PORT || 3000;
const redirect_uri = process.env.HOST + '/redirect';

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
      client_id: 'edab14df29f6b5fb640d',
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
            client_secret: '1d4420717b18915b338aea3284108aca060b36a7',
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

      var output = "<p>You're logged in! Here's all your repos on GitHub: </p>";
      var obj = JSON.parse(body);

      output += "<form action=\"action_page.php\">";

      for (i = 0; i < obj.length; i++) {
        output += "<input type=\"checkbox\" name=";
        output += "\"" + obj[i].name + "\" value=\"" + obj[i].html_url + "\"> " + obj[i].name + "<br>";
      }
      output += "<input type=\"submit\" value=\"Submit\"></form>";
      output += "<p>Go back to <a href=\"./\">log in page</a>.</p>";

      res.send(
        output
      );
      // shell.exec('./path_to_your_file')
    }
  );
});


app.listen(port, () => {
  console.log('Server listening at port ' + port);
});