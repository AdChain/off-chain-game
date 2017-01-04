'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

var ttt = require('./TicTacToeJS')
var gameInstance;
var players = {
  player1:"",
  player2:""
};

var tx = [];

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    // app.start();
    app.io = require('socket.io')(app.start());
    app.io.on('connection', function(socket){
      socket.on('tx', function(msg){
        // TODO : verify hash here
        tx.push(msg)
        console.log('tx: ', tx)
        app.io.emit('tx', tx)
      });
      socket.on('player_loaded', function(msg){ 
          if (players.player1 == "") {
            players.player1 = msg
          } else {
            players.player2 = msg+"2"
            // TODO : start game logging
            gameInstance = new ttt(players.player1, players.player2);
            console.log('gameInstance', gameInstance)
          }
          app.io.emit('player_loaded', players);
          if(players.player2.length > 0) {
            players = {
              player1:"",
              player2:""
            };
          }
      });
      socket.on('disconnect', function(){
          console.log('user disconnected');
          tx = [];
      });
    });
});
