'use strict'

const sublease = require('./')
var channels = [];
var models = {};

exports.register = function(server, _options, next) {
  _options = Object.assign({
    connectionKey: 'connection',
    tenantKey: 'tenant',
    modelKey: 'model',
    getDbName: (req, connection) => connection.name,
  }, _options);

  channels.push(_options);

  for (var i in _options.models) {
    if (models[i]) {
      console.log("Warning!", "Model " + i + " already inserted");
    } else {
      models[i] = channels.length - 1;
    }
  }

  server.ext("onPreAuth", function(request, reply) {
    function modelFunc(modelName, dbName) {
      var channel = channels[models[modelName]];
      var getTenant = sublease(channel.connection, channel.models);
      if (!dbName)
        dbName = channel.getDbName(request, channel.connection)
      const tenant = getTenant(dbName)
      return (tenant.model.bind(tenant))(modelName);
    };

    if(typeof request.app === "undefined")
      request.app = {};

    request.app[_options.modelKey] = modelFunc;
    return reply.continue();
  });
  next();
};

exports.register.attributes = {
  name: 'mongoose-sublease',
  version: '1.0.0',
  multiple: true
};