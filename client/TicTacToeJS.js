class TicTacToeJS {
    constructor(player1, player2) {
        this._players = [];
        this._players[player1] = 1;
        this._players[player2] = 2;
        this._turn = 1;
        this._board = [];
        for (let row = 0; row <3; row++) {
            this._board[row] = [];
            for (let col = 0; col <3; col++) {
                this._board[row][col] = 0;
            }
        }
        this._addressOf = [];
        this._addressOf[1] = player1;
        this._addressOf[2] = player2;
    }

    turn() {
        return this._turn;
    }

    addressOf(_player) {
        return this._addressOf[_player];
    }

    board(row, column) {
        return this._board[row][column];
    }

    hasWon(_player) {
        let board = this._board;
        // horizontal lines
        if ((board[0][0] == _player && board[0][1] == _player && board[0][2] == _player)
            || (board[1][0] == _player && board[1][1] == _player && board[1][2] == _player)
            || (board[2][0] == _player && board[2][1] == _player && board[2][2] == _player)

            // verticle lines
            || (board[0][0] == _player && board[1][0] == _player && board[2][0] == _player)
            || (board[0][1] == _player && board[1][1] == _player && board[2][1] == _player)
            || (board[0][2] == _player && board[1][2] == _player && board[2][2] == _player)

            // diagonal lines
            || (board[0][0] == _player && board[1][1] == _player && board[2][2] == _player)
            || (board[2][0] == _player && board[1][1] == _player && board[0][2] == _player)) {
            return true;
        }
    }

    validMove(_row, _column, _player) {
        if (this._players[_player] > 0
            && _row <= 2
            && _column <= 2
            && this._board[_row][_column] == 0
            && this._turn == this._players[_player]) {
            } else {
                throw "invalid move";
        }
    }

    move(_row, _column, _player) {
        this.validMove(_row, _column, _player);
        this._board[_row][_column] = this._players[_player];
        if (this._players[_player] == 1) {
            this._turn = 2;
        } else {
            this._turn = 1;
        }
        // TODO : provide txhash of move
        // return this._addressOf[_player];
        return `${this._board.toString()}, ${_player}`
    }
}

try {
    module.exports = TicTacToeJS;
    console.log('running in observer mode')
} catch (e) {
    console.log("running client mode")
}
