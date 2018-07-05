const parse = require('url-parse');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const { baseUrl, mongodbConnectionString, mongodbCollection, mongodbDatabase } = require('./config');

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

  displayAllLinks: () => {
    MongoClient.connect(mongodbConnectionString, (err, client) => {
      if (err) {
        console.log(err);
        return;
      }

      const db = client.db(mongodbDatabase);
      const collection = db.collection(mongodbCollection);

      collection.distinct('pathname', function(err, uniqueUrlPathname) {
        if (err) {
          console.log('Unable to fetch links');
          return;
        }

        uniqueUrlPathname.forEach((pathname) => {
          collection.findOne({pathname: pathname}, (err, link) => {
            if (err) {
              console.log(`Unable to fetch link for ${pathname} pathname`);
              return;
            }

            let qs = '';
            console.log(`Url: ${link.origin}${pathname || ''}`);

            link.query && link.query.forEach((q) => {
              if (q && isNaN(q)) {
                qs += q + ',';
              }
            });

            link.query && console.log(`Url query parameters: ${qs}`);

            link.reference && console.log(`Url reference count: ${link.reference}`, '\n');
          });
        });
      });
    });
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

        console.log('\n', `Removed all documents from '${mongodbCollection}' collection`, '\n');
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

          if (link && link.pathname === parsedUrl.pathname) {
            link.reference = _.get(link, 'reference', 1) + 1;
          }
          if (link && ((_.find(link.queryList || [{}], parsedUrl.query) !== undefined) || (Array.isArray(link.queryList)
              && !(link.queryList.length) && _.isEmpty(parsedUrl.query)))) {
            // no logic to update query list when similar urls exist
          } else if (link && (link.href === parsedUrl.href)) {
            // no logic to update query list when similar urls exist
          } else {
            if (!link) {
              link = parsedUrl;
              link.reference = 1;
            }

            if (!Array.isArray(_.get(link, 'queryList'))) {
              link.queryList = [{}];
            }

            if (!Array.isArray(_.get(link, 'query'))) {
              link.query = Object.keys(link.query) || [];
            }

            link.queryList.push(parsedUrl.query);
            link.query.push(...Object.keys(parsedUrl.query));
            link.query = [...new Set(link.query)];
          }

          collection.update({ pathname: link.pathname }, link, { upsert: true }, (err, result) => {
            if (err) {
              console.log('Unable to store links in database', link);
              return;
            }
            console.log('Successfully stored url: ', link.href);
            callback(link.href);
          });
        });
      } catch (err) {

      }
    });
  },
};
