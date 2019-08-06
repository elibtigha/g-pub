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

    // (error, response, head) => {
    //   var output = "<style>h1 {font-family: Trebuchet MS; font-size: 160px;}</style>";
    //   res.send(output);
    // }
    (error, response, body) => {
      var output = "<div class=\"container-fluid\"><nav style=\"margin-bottom: 0; background-color: #22325a; z-index: 9999; border: 0; letter-spacing: 3px; border-radius: 0;\" class=\"navbar navbar-default navbar-fixed-top\">";
      output += "<div class=\"navbar-header\"><button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\"";
      output += "data-target=\"#myNavbar\"><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span><span class=\"icon-bar\"></span></button><a style=\"color: #fff !important; font-family: 'Trebuchet MS'; font-size: 45px !important; padding-right: 50px; padding-left: 50px;padding-top: 25px;padding-bottom: 25px;\" class=\"navbar-brand\" href=\"#\">GitScan</a></div>";
      // every navbar element except "gitscan"
      output += "<div class=\"collapse navbar-collapse\" id=\"myNavbar\"><ul class=\"nav navbar-nav navbar-right\"><li><a style=\"color: #fff ;font-family: MS UI Gothic;font-size: 24px !important;padding-right: 50px;padding-left: 50px;padding-top: 25px;padding-bottom: 25px;\" href=\"#about\">";
      output += "About</a></li><li><a style=\"color: #fff ;font-family: MS UI Gothic;font-size: 24px !important;padding-right: 50px;padding-left: 50px;padding-top: 25px;padding-bottom: 25px;\" href=\"#doc\">";
      output += "Doc</a></li><li><a style=\"color: #fff ;font-family: MS UI Gothic;font-size: 24px !important;padding-right: 50px;padding-left: 50px;padding-top: 25px;padding-bottom: 25px;\" href=\"#contact\">Contact</a></li></ul></div></nav>";
      output += "<br><br><br><br><br><h1 style=\"font-family: MS UI Gothic; color: #22325b\" align=\"center\">Select the repositories you wish to scan: </h1><br><br>";

      var obj = JSON.parse(body);
      output += "<div class=\"container\">";
      output += "<form method=\"get\" action=\"/output\">";

      // repos
      for (i = 0; i < obj.length; i++) {
        output += " <div style=\"text-align:center; color: #000 ;font-family: MS UI Gothic;font-size: 18px;\"><input type=\"checkbox\" style=\"width:30px; height:14px;\" name=";
        output += "\"" + obj[i].name + "\" value=\"" + obj[i].html_url + "\"> " + obj[i].name + "</div><br></a>";
      }
      // submission button
      output += "<br><div style=\"text-align:center;\"><input style=\"font-size: 24px;\" class=\"btn btn-success\" style=\"background-color: #6CC644; border-color: #6CC644;\" name=\"submit\" type=\"submit\" method=\"post\" value=\"Scan selected repos\" action=\"/\"></div></form>";
      
      // the following is everything in the head before the style
      output += "<link rel=\"stylesheet\" type=\"text/css\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css\">";
      output += "<link href=\"mastersheet.css\" rel=\"stylesheet\"></link>";
      output += "<title>GitScan - Scan Repos</title>"
      output += "<script src=\"azure-storage.blob.js\"></script><meta charset=\"utf-8\" /><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\"></meta>";
      res.send(output);

      // style=\"color: #fff !important; font-family: 'Trebuchet MS'; font-size: 45px !important; padding-right: 50px; padding-left: 50px;padding-top: 25px;padding-bottom: 25px;\"
    }
  );
});

app.get('/done', (req, res, next) => {
  res.sendFile(__dirname + '/done.html');
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


