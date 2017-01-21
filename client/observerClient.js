function joinGame(address) {
  let request = new XMLHttpRequest();
  request.open('POST', '/api/games/start')
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send(`player=${address}`)
}

function closeGame(winner) {
  let request = new XMLHttpRequest();
  request.open('POST', '/api/games/close')
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send(`winner=${winner}`)
}

function sendTransaction(tx) {
  let request = new XMLHttpRequest();
  request.open('POST', '/api/transactions')
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify(tx))
}

function verify(address) {
  let request = new XMLHttpRequest();
  request.open('POST', '/api/transactions/verify')
  request.send()
}

