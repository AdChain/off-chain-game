'use strict';

const sha256 = require('js-sha256');
const TicTacToe = require('../../client/TicTacToeJS');

module.exports = function(Transaction) {
  // Disable APIs that allow to remove to change existing transactions
  Transaction.disableRemoteMethod('upsert', true);
  Transaction.disableRemoteMethod('upsertWithWhere', true);
  Transaction.disableRemoteMethod('updateAll', true);
  Transaction.disableRemoteMethod('replaceOrCreate', true);
  Transaction.disableRemoteMethod('patchOrCreate', true);
  Transaction.disableRemoteMethod('exists', true);
  Transaction.disableRemoteMethod('deleteById', true);
  Transaction.disableRemoteMethod('replaceById', true);
  Transaction.disableRemoteMethod('updateAttributes', false);
  Transaction.disableRemoteMethod('patchAtrributes', false);

  Transaction.afterCreate = function(next) {
    Transaction.app.io.emit('tx', this.toJSON());
    next();
  };

  Transaction.verify = function(cb) {
    const Game = Transaction.app.models.Game;

    let hash = [Game.sourceHash];
    let gameInstance = new TicTacToe(Game.players.player1, Game.players.player2);

    Transaction.find((err, tx) => {
      for (const itm of tx) {
        let cheated = false;

        try {
          const move = gameInstance.move(itm.row, itm.col, itm.player);
          hash.push(sha256(move));
        } catch (err) {
          console.log(err);
          cheated = true;
        }

        if (!cheated) {
          const verification = sha256(hash.toString());
          if (verification != itm.hash) {
            console.log('invalid hash');
            cheated = true;
          }
        }

        if (cheated) {
          Transaction.app.io.emit('verify', itm.player);

          let winner;
          if (itm.player == Game.players.player1) {
            winner = Game.players.player2;
          } else {
            winner = Game.players.player1;
          }

          Game.closeContract(winner, cb);
          return;
        }
      };

      cb();
    });
  };

  Transaction.remoteMethod('verify', {});
};
