'use strict';
var TestRPC = require('ethereumjs-testrpc');
var TestRPCPort = 8545;
var blockchain = TestRPC.server();

blockchain.listen(TestRPCPort, function(bcErr, resp){
  var loopback = require('loopback');
  var boot = require('loopback-boot');
  var socketio = require('socket.io');
  var app = module.exports = loopback();

  app.start = function() {
    console.log('start web server')
    // start the web server
    var server = app.listen(function() {
      app.emit('started');
      var baseUrl = app.get('url').replace(/\/$/, '');
      console.log('Web server listening at: %s', baseUrl);
      if (app.get('loopback-component-explorer')) {
        var explorerPath = app.get('loopback-component-explorer').mountPath;
        console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      }
    });

    app.io = socketio(server);
    app.io.on('connection', function(socket) {
      console.log('client connected', socket.id);

      if (app.models.Game.checkin.length > 0) {
        socket.emit('players', app.models.Game.checkin);
      }

      socket.on('disconnect', function() {
        console.log('client disconnected', socket.id);
      });
    });
    console.log('server', server)
    return server;
  };

  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname, function(err) {
    console.log('err', err)
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
      app.start();
  });
})
