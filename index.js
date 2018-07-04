const Promise = require('bluebird');
var MongoDB = Promise.promisifyAll(require('mongodb'));
var MongoClient = Promise.promisifyAll(MongoDB.MongoClient);
const rp = require('request-promise');
const cheerio = require('cheerio');

const config = require('./config');
const utils = require('./utils');

const { baseUrl, promiseTimeout, requestTimeout, totalIterations, requestConcurrency,
  mongodbConnectionString, mongodbCollection } = config;
const { validURL, collectInternalLinks, urlObject } = utils;

const urls = [ baseUrl ];
const dictionary = {};

Promise.map(new Array(totalIterations), function() {
  const url = urls.shift();
  const options = {
    uri: url,
    resolveWithFullResponse: true,
    timeout: requestTimeout,
  };

  if (validURL(url) && !dictionary[url]) {
    return rp(options)
      .then((response) => {
        if (response.statusCode !== 200) {
          throw new Error();
        }

        const $ = cheerio.load(response.body);
        const links = collectInternalLinks($);

        dictionary[url] = true;
        urls.push(...links);
      })
      .then(() => {
        return MongoClient.connectAsync(mongodbConnectionString);
      })
      .then((db) => {
        db.listCollections({ name: mongodbCollection }, (err, list) => {
          if (err || !list.length) {
            db.createCollection(mongodbCollection, {}, () => {});
          }
        });

        return db;
      })
      .then((db) => {
        const linkCollection = db.collection(mongodbCollection);
        const urlObj = urlObject(url);
      })
      .catch((error) => {
        console.log('Unable to fetch data for: ', url);
      });
  } else {
    return Promise.delay(promiseTimeout).then(() => {});
  }
}, { concurrency: requestConcurrency})
  .then(function() {
    console.log('finished crawling');
  });
