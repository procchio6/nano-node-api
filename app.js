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

app.use('/account', require('./routes/account'))
app.use('/block', require('./routes/block'))

app.ws('/blocks/stream', (ws, req) => {
    const {types} = req.query
    let allowedTypesArray = []

    if (types) {
        allowedTypesArray = types.split(",")
    }
    
    ws.allowedTypesArray = allowedTypesArray
})

app.post('/callback', async (req, res) => {
    console.log("CALLBACK")
    console.log("Receiving callback from", req.get('Origin'))
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
