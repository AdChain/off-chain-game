pragma solidity ^0.4.3;

contract Verify {
    string _player1;
    string _player2;
    string _source;
    int _state; // either closed (0) or opened (1)
    string _winner;
    function Verify() {
        _state = 0;
    }

    function open(string player1, string player2, string source) {
        if (_state == 0) {
            _state = 1;
            _player1 = player1;
            _player2 = player2;
            _source = source;
        }
    }

    function close(string winner) public returns (string result) {
        if (_state == 1) {
            _state = 0;
            _winner = winner;
            return winner;   
        }
    }
}