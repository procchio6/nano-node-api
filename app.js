if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const {PORT, NODE_URL} = process.env

const express = require('express')
const app = express()

const expressWs = require('express-ws')(app);
const WebSocket = require('ws')

const fetch = require('node-fetch')
const Nano = require('nanode')

const nano = new Nano({url: NODE_URL, apiKey: ""})

const bodyParser = require('body-parser')
app.use(bodyParser.json())

app.get('/', (req, res) => res.json({"success": ""}))

app.get('/create_account', async (req, res) => {
    const account = await nano.key.create()
    res.json(account)
})

app.get('/account/:address', async (req, res) => {
    const {address} = req.params
    const accountInfo = await nano.accounts.info(address)
    res.json(accountInfo)
})

app.get('/account/:address/balance', async (req, res) => {
    const {address} = req.params
    try {
        const nanoBalance = await nano.accounts.nanoBalance(address)
        res.json({balance: nanoBalance})
    } catch (error) {
        res.json({error: "Account not found"}).status(404)
    }
})

app.get('/block_count', async (req, res) => {
    const blockCount = await nano.blocks.count()
    res.json(blockCount)
})

app.get('/block/:blockHash', async (req, res) => {
    const {blockHash} = req.params
    try {
        const block = await nano.blocks.info(blockHash, true)
        res.json(JSON.parse(block))
    } catch (error) {
        res.json({error: "Block not found"}).status(404)
    }
})

app.get('/block/:blockHash/history', async (req, res) => {
    const {blockHash} = req.params
    const {count = 1} = req.query
    try {
        const blockHistory = await nano.blocks.history(blockHash, count)
        if (blockHistory.history == "") {
            throw new Error("Block not found")
        }
        res.json(blockHistory)
    } catch (error) {
        res.json({error: error.message}).status(404)
    }
})

app.ws('/blocks/stream', (ws, req) => {
    const {types} = req.query
    let allowedTypesArray = []

    if (types) {
        allowedTypesArray = types.split(",")
    }
    
    ws.allowedTypesArray = allowedTypesArray
})

app.post('/callback', async (req, res) => {
    if (req.get('host') != process.env.NODE_HOST) {
        res.status(401).end()
        return;
    }

    const {hash, block} = req.body

    const retrievedBlock = await nano.blocks.info(hash)

    if (JSON.stringify(retrievedBlock) == JSON.stringify(block)) {
       broadcastBlock(retrievedBlock)        
    }
})

function broadcastBlock(block) {
    const blockObj = JSON.parse(block)

    expressWs.getWss().clients.forEach(client => {
        if (client !== expressWs && client.readyState === WebSocket.OPEN) {
            if (client.allowedTypesArray.includes(blockObj.type) || client.allowedTypesArray.length === 0) {
                client.send(block);
            }
        }
    })
}

app.listen(PORT, () => console.log(`App listening on port ${PORT}`))
