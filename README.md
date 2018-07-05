# Web-Crawler
web-crawler built in nodejs

### Description
A web-crawler built to store all the hyperlinks encountered on a website and crawl through to fetch subsequent one. Stores data for every unique url, the query parameters associated with a pathname and occurance of the url for given iterations.

Application is integrated with mongodb cloud for storging data. Hence, local dependency for database is not needed.For more information, refer to: https://docs.atlas.mongodb.com/

The configuration for the crawler can be changed in config.js. The default config is as: 

  `baseUrl`: The starting url(https://medium.com),
  `totalIterations`: total iterations for web crawler(25),
  `promiseTimeout`: timeout for promise for url miss(5000),
  `requestTimeout`: timeout for every request(10000),
  `requestConcurrency`: max promises to be executed in paraller(5),
  `mongodbConnectionString`: mongoDB connection string,
  `mongodbCollection`: MongoDB collection(LinkCollection),
  `mongodbDatabase`: MongoDB database(LinkDatabase),

### Demo

There is not an online demo, so if you want to take a peek into how the app will look like once it's
done till the end, you will need to do the following:

  1. Install Node.js (with npm)
  2. Clone this repository
  3. Run `npm install` in the project directory
  4. Run `npm run start` to begin web crawler.
