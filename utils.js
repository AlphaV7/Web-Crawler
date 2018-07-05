const parse = require('url-parse');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const { baseUrl, mongodbConnectionString, mongodbCollection, mongodbDatabase } = require('./config');
const keys = ['slashes', 'protocol', 'hash', 'query', 'pathname', 'auth', 'host',
  'port', 'hostname', 'origin', 'href', 'queryList'];

module.exports = {
  collectInternalLinks: ($) => {
    const allLinks = [];

    $(`a[href^='/']`).each(() => {
      const link = $(this).attr('href');

      link && link.includes('medium') && allLinks.push(`${baseUrl}${link}`);
    });

    $(`a[href^='http']`).each(function() {
      const link = $(this).attr('href');

      link && link.includes('medium') && allLinks.push(link);
    });

    return allLinks;
  },

  validURL: (url) => {
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    if (!url || typeof url !== 'string') {
      return false;
    }

    return pattern.test(url);
  },

  dropLinksInDatabase: () => {
    MongoClient.connect(mongodbConnectionString, (err, client) => {
      if (err) {
        console.log(err);
        return;
      }

      const db = client.db(mongodbDatabase);
      const collection = db.collection(mongodbCollection);

      collection.remove({}, (err, result) => {
        if (err) {
          console.log('Unable to empty collection. Output may vary');
          return;
        }

        console.log(`Removed document from '${mongodbCollection}' collection`);
      });
    });
  },

  storeLinkInDatabase: (url, callback) => {
    MongoClient.connect(mongodbConnectionString, (err, client) => {
      if (err) {
        console.log(err);
        return false;
      }

      const db = client.db(mongodbDatabase);
      const collection = db.collection(mongodbCollection);
      const parsedUrl = parse(url, true);

      try {
        collection.findOne({ origin: parsedUrl.origin, pathname: parsedUrl.pathname }, (err, link) => {
          if (err) {
            console.log('Unable to access database');
            return;
          }

          let update = true;

          if (link && ((_.find(link.queryList || [{}], parsedUrl.query) !== undefined) || (Array.isArray(link.queryList)
              && !(link.queryList.length) && _.isEmpty(parsedUrl.query)))) {
            update = false;
          } else if (link && (link.href === parsedUrl.href)) {
            update = false;
          } else {
            if (!link) {
              link = parsedUrl;
            }

            if (!Array.isArray(_.get(link, 'queryList'))) {
              link.queryList = [{}];
            }

            if (!Array.isArray(_.get(link, 'query'))) {
              link.query = Object.keys(link.query) || [];
            }

            link.queryList.push(parsedUrl.query);
            link.query.push(...Object.keys(parsedUrl.query));
            link.reference = _.get(link, 'reference', 0) + 1;
          }

          update === true && collection.insert(_.pick(link, keys), (err, result) => {
            if (err) {
              console.log('Unable to store links in database', link);
              return;
            }
            console.log('Successfully stored url: ', _.get(result, 'ops[0].href'));
            callback(_.get(result, 'ops[0].href'));
          });
        });
      } catch (err) {

      }
    });
  },
};
