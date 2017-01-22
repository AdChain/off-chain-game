'use strict';

const sha256 = require('js-sha256');
const fs = require('fs');

module.exports = function(Game) {
  Game.checkin = [];
  Game.player1 = null;
  Game.player2 = null;
  Game.instance = null;

  let contractInstance;

  fs.readFile('client/TicTacToeJS.js', 'utf8', (err, data) => {
    if (err) {
      return console.log(err);
    }
    Game.sourceHash = sha256(data);
  });

  Game.start = function(playerAddr, cb) {
    if (Game.checkin.length >= 2) {
      return cb('two players have already joined');
    }

    if (Game.checkin[0] == playerAddr) {
      return cb('this player has already joined');
    }

    Game.checkin.push(playerAddr);

    console.log('Players:', Game.checkin.join(', '));
    Game.app.io.emit('players', Game.checkin);

    if (Game.checkin.length < 2) {
      return cb();
    }

    Game.player1 = Game.checkin[0];
    Game.player2 = Game.checkin[1];

    console.log('initiate smart contract');
    // smart contract START
    Game.app.models.Contract.construct({}, (err, {id}) => {
      if (err) {
        return cb(err);
      }

      contractInstance = new Game.app.models.Contract({id});
      contractInstance.open({
        player1: Game.player1,
        player2: Game.player2,
        source: Game.sourceHash,
      }, (err) => {
        if (err) {
          return cb(err);
        }

        Game.app.io.emit('start');
        return cb(null);
      });
    });
  };

  Game.remoteMethod('start', {
    accepts: {arg: 'player', type: 'string', required: true},
  });

  Game.close = function(winner, cb) {
    Game.checkin.pop();
    if (Game.checkin.length == 0) {
      Game.closeContract(winner, cb);
    } else {
      cb();
    }
  };

  Game.remoteMethod('close', {
    accepts: {arg: 'winner', type: 'string', required: true},
  });

  Game.closeContract = function(winner, cb) {
    console.log('close smart contract');
    contractInstance.close({winner: winner}, err => {
      if (err) {
        return cb(err);
      }
      return cb();
    });
  };
};
