'use strict';
let loopback = require('loopback');
let boot = require('loopback-boot');

let app = module.exports = loopback();

let ttt = require('../client/TicTacToeJS')
let gameInstance;
let players = {
  player1:"",
  player2:""
};

let tx = [];
let hash = [];
let sha256 = require('js-sha256');

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

    let fs = require('fs')
    fs.readFile(`${__dirname}/../client/index.html`, 'utf8', (err,data) => {
      if (err) {
        return console.log(err);
      }
      hash.push(sha256(data))
    });

    app.io.on('connection', socket => {
      socket.on('tx', msg => {
        tx.push(msg)
        app.io.emit('tx', tx)
      });
      socket.on('verify', msg => {
        tx.map(itm=>{
          let move = sha256(gameInstance.move(itm.row, itm.col, itm.player))
          hash.push(move);
          let verification = sha256(hash.toString())
          let cheater = ""
          if (verification != itm.hash) {
            app.io.emit('verify', itm.player)
          }
        })
      });

      socket.on('player_loaded', msg => { 
          if (players.player1 == "") {
            players.player1 = msg
          } else {
            players.player2 = msg+"2"
            // TODO : start game logging
            gameInstance = new ttt(players.player1, players.player2);
          }
          app.io.emit('player_loaded', players);
          if(players.player2.length > 0) {
            players = {
              player1:"",
              player2:""
            };
          }
      });
      socket.on('disconnect', () => {
          console.log('user disconnected');
          tx = [];
      });
    });
});
