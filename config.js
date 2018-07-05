module.exports = {
  baseUrl: 'https://medium.com',
  totalIterations: 50,
  promiseTimeout: 5000,
  requestTimeout: 6000,
  requestConcurrency: 5,
  mongodbConnectionString: `mongodb://new-user1:g0eH6NzLuBTwcMXU@cluster0-shard-00-00-nqjlc.mongodb.net:27017,cluster0-shard-00-01-nqjlc.mongodb.net:27017,cluster0-shard-00-02-nqjlc.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`,
  mongodbCollection: 'LinkCollection',
  mongodbDatabase: 'LinkDatabase',
};
