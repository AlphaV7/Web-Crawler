const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');

const { baseUrl, promiseTimeout, requestTimeout, totalIterations, requestConcurrency } = require('./config');
const { validURL, collectInternalLinks, storeLinkInDatabase, dropLinksInDatabase} = require('./utils');

const urls = [ baseUrl ];
const dictionary = {};

let crawledUrls = 0;

dropLinksInDatabase();

Promise.map(new Array(totalIterations), function() {
  const url = urls.shift();
  const options = {
    uri: url,
    resolveWithFullResponse: true,
    timeout: requestTimeout,
  };

  if (validURL(url) && dictionary.url !== true) {
    return rp(options)
      .then((response) => {
        if (response.statusCode !== 200) {
          throw new Error();
        }

        const $ = cheerio.load(response.body);
        const links = collectInternalLinks($);

        urls.push(...links);
      })
      .then(() => {
        storeLinkInDatabase(url, (storedUrl) => {
          dictionary.storedUrl = true;
          crawledUrls++;
        });
      })
      .catch((error) => {
        console.log('Unable to fetch data for: ', url, error.RequestError);
      });
  } else {
    return Promise.delay(promiseTimeout).then(() => {});
  }
}, { concurrency: requestConcurrency})
  .then(function() {
    console.log('Finished crawling');
    console.log(`Stored ${crawledUrls} urls`);
    process.exit();
  });
