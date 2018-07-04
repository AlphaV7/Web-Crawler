const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');

const config = require('./config');
const utils = require('./utils');

const { baseUrl, promiseTimeout, requestTimeout, totalIterations, requestConcurrency } = config;
const { validURL, collectInternalLinks } = utils;

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
      .then(function(response) {
        if (response.statusCode !== 200) {
          throw new Error();
        }

        const $ = cheerio.load(response.body);
        const links = collectInternalLinks($);

        dictionary[url] = true;
        urls.push(...links);
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
