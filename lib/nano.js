const { Nano } = require('nanode')

const nano = new Nano({url: process.env.NODE_URL})

module.exports = nano