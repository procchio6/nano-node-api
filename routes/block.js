const router = require('express').Router()
const Nano = require('nanode')

const nano = new Nano({url: process.env.NODE_URL, apiKey: ""})

router.get('/count', async (req, res) => {
    const blockCount = await nano.blocks.count()
    res.json(blockCount)
})

router.get('/:blockHash', async (req, res) => {
    const {blockHash} = req.params
    try {
        const block = await nano.blocks.info(blockHash, true)
        res.json(JSON.parse(block))
    } catch (error) {
        res.json({error: "Block not found"}).status(404)
    }
})

router.get('/:blockHash/history', async (req, res) => {
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

module.exports = router