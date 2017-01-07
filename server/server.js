'use strict';
const loopback = require('loopback')
const boot = require('loopback-boot')
const app = module.exports = loopback()

const sha256 = require('js-sha256')
const ttt = require('../client/TicTacToeJS')
const Eth = require('ethjs')
const TestRPC = require('ethereumjs-testrpc')
const eth = new Eth(TestRPC.provider())

const verifyBytecode = '606060405234610000575b60006003819055505b5b610500806100236000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063943654e0146100495780639d869eac14610126575b610000565b3461000057610124600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610204565b005b346100005761017b600480803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610401565b60405180806020018281038252838181518152602001915080519060200190808383600083146101ca575b8051825260208311156101ca576020820191506020810190506020830392506101a6565b505050905090810190601f1680156101f65780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b600060035414156103fb5760016003819055508260009080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061026357805160ff1916838001178555610291565b82800160010185558215610291579182015b82811115610290578251825591602001919060010190610275565b5b5090506102b691905b808211156102b257600081600090555060010161029a565b5090565b50508160019080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061030457805160ff1916838001178555610332565b82800160010185558215610332579182015b82811115610331578251825591602001919060010190610316565b5b50905061035791905b8082111561035357600081600090555060010161033b565b5090565b50508060029080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106103a557805160ff19168380011785556103d3565b828001600101855582156103d3579182015b828111156103d25782518255916020019190600101906103b7565b5b5090506103f891905b808211156103f45760008160009055506001016103dc565b5090565b50505b5b505050565b6020604051908101604052806000815250600160035414156104ce5760006003819055508160049080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061047157805160ff191683800117855561049f565b8280016001018555821561049f579182015b8281111561049e578251825591602001919060010190610483565b5b5090506104c491905b808211156104c05760008160009055506001016104a8565b5090565b50508190506104cf565b5b9190505600a165627a7a72305820a59040ea51acd5ae698389580269ea94ea2ed57d323190660fd5535d3bf5e08e0029'
const verifyABI = JSON.parse('[{"constant":false,"inputs":[{"name":"player1","type":"string"},{"name":"player2","type":"string"},{"name":"source","type":"string"}],"name":"open","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"winner","type":"string"}],"name":"close","outputs":[{"name":"result","type":"string"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"}]')
let VerifyContract
let contractInstance
let contractAddress
let gameInstance
let players = {
  player1:"",
  player2:""
}
let checkin = []
let tx = []
let hash = []


eth.accounts((err, accounts) => {
  VerifyContract = eth.contract(verifyABI, verifyBytecode, { from: accounts[0], gas: '3000000' })
})



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
  })
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err

  // start the server if `$ node server.js`
  if (require.main === module)
    // app.start();
    app.io = require('socket.io')(app.start())

    let fs = require('fs')
    fs.readFile(`${__dirname}/../client/TicTacToeJS.js`, 'utf8', (err,data) => {
      if (err) {
        return console.log(err)
      }
      hash.push(sha256(data))
    })

    app.io.on('connection', socket => {
      socket.on('tx', msg => {
        tx.push(msg)
        app.io.emit('tx', tx)
      })

      socket.on('verify', msg => {
        tx.map(itm=>{
          let move = sha256(gameInstance.move(itm.row, itm.col, itm.player))
          hash.push(move);
          let verification = sha256(hash.toString())
          let cheater = ""
          let winner = ""
          if (verification != itm.hash) {
            app.io.emit('verify', itm.player)
            if(itm.player == players.player1) {
              winner = players.player2
            } else {
              winner = players.player1
            }
            console.log('close smart contract')
            contractInstance.close(winner).then(result => {
              
            })
          }
        })
      })

      socket.on('start', msg => {
        // console.log('start, msg', msg)
        checkin.push(msg)
        if (checkin.length == 2) {
          app.io.emit('players',checkin)
          if (checkin[0] != checkin[1]) {
            console.log('initiate smart contract')
            // smart contract START
            VerifyContract.new((err, txHash) => {
              var receiptInterval = setInterval(() => {
                eth.getTransactionReceipt(txHash, (receiptErr, receipt)=>{
                  if (receipt) {
                    clearInterval(receiptInterval);
                    contractAddress = receipt.contractAddress
                    contractInstance = VerifyContract.at(contractAddress)
                    contractInstance.open(players.player1, players.player1, hash[0])
                    
                  }
                });
              }, 300);
            })
          }
        }
      })

      socket.on('close', msg => {
        checkin.pop()
        if (checkin.length == 0) {
          console.log('close smart contract')
          contractInstance.close(msg).then(result => {
            
          })
        }
        
      })

      socket.on('player_loaded', msg => { 
          if (players.player1 == "") {
            players.player1 = msg
            console.log('player1', players.player1)
          } else {
            players.player2 = msg+"2"
            console.log('player2', players.player2)
            gameInstance = new ttt(players.player1, players.player2);
            
          }
          app.io.emit('player_loaded', players);
          if(players.player2.length > 0) {
            players = {
              player1:"",
              player2:""
            }
          }
      })

      socket.on('disconnect', () => {
          console.log('user disconnected')
          tx = []
          checkin = []
      })
    })
})
