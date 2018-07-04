const { baseUrl } = require('./config');

module.exports = {
  collectInternalLinks: function($) {
    const allLinks = [];

    $(`a[href^='/']`).each(function() {
      const link = $(this).attr('href');

      link.includes('medium') && allLinks.push(`${baseUrl}${link}`);
    });

    $(`a[href^='http']`).each(function() {
      const link = $(this).attr('href');

      link.includes('medium') && allLinks.push(link);
    });

    console.log('Found ' + allLinks.length + ' links');
    return allLinks;
  },

  validURL: function(url) {
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    if (!url || typeof url !== 'string') {
      return false;
    }

    return pattern.test(url);
  },
};
