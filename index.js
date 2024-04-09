
/* URL Shortener Microservice with MongoDB Atlas integration
  This file i writed alone, but the HTML/CSS of this project was
  writed for other dev.
*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const url = require('url-parse');
const dns = require('dns');
const { MongoClient } = require('mongodb');


// MongoDB configuration
process.env.URI='mongodb+srv://YourName:<password>@mycluster.pyhihoy.mongodb.net/?retryWrites=true&w=majority&appName=myCluster'
const client = new MongoClient(process.env.URI);

client.connect();

// Creating the DB and your colletion to save the urls
const db = client.db('urlshortener');
const urls = db.collection('urls');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API endpoints

app.post('/api/shorturl', async function(req, res) {
  try {
      const address = await new Promise((resolve, reject) => {
          dns.lookup(new URL(req.body.url).hostname, (err, address) => {
              if (err) {
                res.json({ error: 'invalid url' });
              } else {
                  resolve(address);
              }
          });
      });

      if (!address) {
          res.json({ error: 'invalid url' });
      } else {
          const alreadyExist = await urls.findOne({ "original_url": req.body.url }, 
          { _id: 0, original_url: 1, short_url: 1});
          if (alreadyExist) {
              res.json(alreadyExist);
          } else {
              const countDocuments = await urls.countDocuments({});
              const postDoc = {
                  "original_url": req.body.url,
                  "short_url": countDocuments
              };
              await urls.insertOne(postDoc); 
              res.json(postDoc);
          }
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ "error": "Internal server error" });
  }
});

app.get('/api/shorturl/:number', async (req, res) => {
  const thisExist = await urls.findOne({"short_url": +req.params.number});
  res.redirect(thisExist.original_url);
})



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
