const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.json(cachedResponse);
      return;
    }

    res.originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.originalJson(body);
    };
    next();
  };
}

module.exports = cacheMiddleware;