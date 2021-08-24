const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const fs = require('fs');
const bcrypt = require('bcrypt');
const port = 3000;

// reading data from json file
let jsonUsersData = fs.readFileSync(`${__dirname}/json_data/user.json`);
jsUsersData = JSON.parse(jsonUsersData);

let flag = 0;

// return a token
let signToken = (username, jwt) => {
  return jwt.sign({ username: username }, 'my-ultra-high-secure-secret-key');
};

// verify token
const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  if (token) {
    token = token.replace(/\r?\n|\r/g, '');
  }

  if (!token) {
    return res.status(403).json({ error: 'A token is required to access this page' });
  }
  try {
    const decoded = jwt.verify(token, 'my-ultra-high-secure-secret-key'); // wrong secret key leads to an error
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
};

// setting up view engine
// app.set('view engine', 'ejs');

// handle invalid routes
// app.use((req, res, next) => {
//   res.status(404).send('ERROR! Page Not Found!');
// });

// to get data from the html page
// app.use(express.urlencoded());
app.use(express.json());

// route for sign up
// app.get('/create', (req, res) => {
//   // old code
//   res.sendFile(`${__dirname}/index.html`);
// });

// new code for adding user
app.post('/create', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(403).json({ error: 'Please fill all details' });
  }

  jsUsersData.forEach((user) => {
    if (user.username == req.body.username) {
      flag = 1;
      return res.status(403).json({ error: 'User already exist!' });
    }
  });
  if (flag == 0) {
    const token = signToken(req.body.username, jwt);
    bcrypt.hash(req.body.password, 10, function (err, hashedData) {
      const newUser = {
        username: req.body.username,
        password: hashedData,
        notes: [],
      };

      jsUsersData.push(newUser);
      const jsonUsers = JSON.stringify(jsUsersData);
      fs.writeFile(`${__dirname}/json_data/user.json`, jsonUsers, (err) => {
        if (err) {
          return console.log(err);
        }
      });
      // newUser.token = token;
      res.json(newUser);
    });
  }
  flag = 0;
});

// route for adding new user
// app.post('/checkCreate', (req, res) => {
//   jsUsersData.forEach((user) => {
//     if (user.username == req.body.username) {
//       flag = 1;
//       // res.end('User already exist!');
//       throw new Error('User already exist!');
//     }
//   });
//   if (flag == 0) {
//     const newUser = {
//       username: req.body.username,
//       password: req.body.password,
//       notes: [],
//     };

//     jsUsersData.push(newUser);
//     const jsonUsers = JSON.stringify(jsUsersData);
//     fs.writeFile(`${__dirname}/json_data/user.json`, jsonUsers, (err) => {
//       if (err) {
//         return console.log(err);
//       }
//     });

//     res.sendFile(`${__dirname}/login.html`);
//   }
//   flag = 0;
// });

// route for login page
// app.get('/', (req, res) => {
//   // old code
//   // res.sendFile(`${__dirname}/login.html`);

//   // new code
//   res.json(jsUsersData);
// });

// route for checking login details
// app.post('/checkLogin', (req, res) => {
//   jsUsersData.forEach((user) => {
//     if (user.username == req.body.username && user.password == req.body.password) {
//       flag = 1;
//       const data = { username: req.body.username, notes: user.notes };
//       res.render('home', { data: data });
//     }
//   });
//   if (flag == 0) {
//     // res.end('Wrong username or password');
//     throw new Error('Wrong username or password');
//   }
//   flag = 0;
// });

app.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(403).json({ error: 'Please fill all details' });
  }
  jsUsersData.forEach((user) => {
    if (user.username == req.body.username && bcrypt.compare(req.body.password, user.password)) {
      flag = 1;
      const token = signToken(req.body.username, jwt);
      // console.log(user);
      if (jwt.verify(token, 'my-ultra-high-secure-secret-key')) {
        user.token = token;
        res.json(user);
      } else {
        res.status(401).json({ error: 'Invalid token' });
      }
    }
  });
  if (flag == 0) {
    return res.status(403).json({ error: 'Wrong username or password' });
  }
  flag = 0;
});

// route to add note
// app.post('/addNote/id/:username', (req, res) => {
//   // console.log(req.params.username);
//   jsUsersData.forEach((user) => {
//     if (user.username == req.params.username) {
//       user.notes.push(req.body.mynote);
//       const data = { username: req.params.username, notes: user.notes };
//       res.render('home', { data: data });
//     }
//   });
//   const jsonUsers = JSON.stringify(jsUsersData);
//   fs.writeFile(`${__dirname}/json_data/user.json`, jsonUsers, (err) => {
//     if (err) {
//       return console.log(err);
//     }
//   });
// });

// new route to add note
app.post('/addNote', verifyToken, (req, res) => {
  if (req.body.newnote == null || req.body.newnote == '') {
    return res.status(403).json({ error: "ERROR! Can't add empty note" });
  }
  jsUsersData.forEach((user) => {
    if (user.username == req.user.username) {
      user.notes.push(req.body.newnote);
      const data = { username: req.user.username, notes: user.notes };
      res.json(data);
    }
  });
  const jsonUsers = JSON.stringify(jsUsersData);
  fs.writeFile(`${__dirname}/json_data/user.json`, jsonUsers, (err) => {
    if (err) {
      return console.log(err);
    }
  });
});

app.get('/notes', verifyToken, (req, res) => {
  jsUsersData.forEach((user) => {
    if (req.user.username == user.username) {
      res.json(user.notes);
    }
  });
});

app.get('*', function (req, res) {
  res.status(404).json({ status: 'Fail', error: 'ERROR! Page Not Found!' });
});

app.listen(port, () => console.log(`Todo app listening on port 3000!`));
