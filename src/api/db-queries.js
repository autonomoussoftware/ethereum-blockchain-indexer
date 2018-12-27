'use strict'

const promiseAllProps = require('promise-all-props')

// Global reference to the database API
let db

// Sets the database reference
function setDb (ref) {
  db = ref
}

// get best block from db and parse the string
const getBestBlock = () => db.getBestBlock()

// get only the best block number
const getBestBlockNumber = () => db.getBestBlock().then(b => b.number)

// get all ETH transactions of an address
const getAddressTransactions = ({ address, from, to }) =>
  promiseAllProps({
    min: from || 0,
    max: to || getBestBlockNumber()
  })
    .then(({ min, max }) =>
      db.getAddressTransactions({ addr: address, min, max })
    )

module.exports = {
  getAddressTransactions,
  getBestBlock,
  getBestBlockNumber,
  setDb
}
