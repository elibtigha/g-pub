// Required modules
require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const request = require('request');
const qs = require('querystring');
const url = require('url');
const randomString = require('randomstring');
const JSONObject = require('JSONObject');

// Local hostS
const port = process.env.PORT || 3000;
const redirect_uri = process.env.HOST + '/redirect';

// Azure Blob Storage Account Information
// var blobUri = 'https://' + 'STORAGE_ACCOUNT' + '.blob.core.windows.net';
// var blobService = AzureStorage.Blob.createBlobServiceWithSas(blobUri, 'SAS_TOKEN');




app.use(express.static('views'));
app.use(
  session({
    secret: randomString.generate(),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);


// Home page
app.get('/', (req, res, next) => {
  res.sendFile(__dirname + '/index.html');
});


app.get('/done', (req, res, next) => {
  res.sendFile(__dirname + '/done.html');
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
  // console.log('Request sent by GitHub: ');
  // console.log(req.query);
  const code = req.query.code;
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
        // console.log('Your Access Token: ');
        // console.log(qs.parse(body));
        req.session.access_token = qs.parse(body).access_token;
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
      output += "<form method=\"get\" action=\"/output\">";

      for (i = 0; i < obj.length; i++) {
        output += "<a href = \"" + obj[i].html_url + "\"><input type=\"checkbox\" name=";
        output += "\"" + obj[i].name + "\" value=\"" + obj[i].html_url + "\"> " + obj[i].name + "<br></a>";
      }

      output += "<input name=\"submit\" type=\"submit\" method=\"post\" value=\"scan\" action=\"/\"></form>";
      output += "<p>Go back to <a href=\"./\">log in page</a>.</p>";
      res.send(output);
    }
  );
});


app.get('/output', (req, res) => {
  const sub = req.query;
  function replacer(key, value) {
    if (key === 'submit') {
      return undefined;
    }
    return value;
  }
  const userStr = JSON.stringify(sub, replacer);
  const userStr2 = JSON.parse(userStr);
  for (var key in userStr2) {
    console.log(key + " -> " + userStr2[key]);
  }
  res.redirect('/done');
})

app.listen(port, () => {
  console.log('Server listening at port ' + port);
});


// ECHO OFF
// for /F "tokens=*" %%A in (repos.csv) do git clone https://github.com/elibtigha/%%A.git %%A
// PAUSE


