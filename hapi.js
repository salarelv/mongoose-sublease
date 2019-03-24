'use strict'

const sublease = require('./')
var channels = [];
var models = {};
const plugin = {
  name: 'MongooseSublease',
  version: '1.0.1',
  multiple: true,
  register: async function (server, options) {
    var _options = Object.assign({
      connectionKey: 'connection',
      tenantKey: 'tenant',
      modelKey: 'model',
      getDbName: (req, connection) => connection.name,
    }, options);

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
      return;
    });
  }
};

exports.plugin = plugin;
