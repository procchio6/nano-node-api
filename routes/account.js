const router = require('express').Router()
const nano = require('../lib/nano')

router.get('/create', async (req, res) => {
    const account = await nano.key.create()
    res.json(account)
})

router.get('/:address', async (req, res) => {
    const {address} = req.params
    const accountInfo = await nano.accounts.info(address)
    res.json(accountInfo)
})

router.get('/:address/balance', async (req, res) => {
    const {address} = req.params
    try {
        const nanoBalance = await nano.accounts.nanoBalance(address)
        res.json({balance: nanoBalance})
    } catch (error) {
        res.json({error: "Account not found"}).status(404)
    }
})

module.exports = router