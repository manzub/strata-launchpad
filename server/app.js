require('dotenv').config();
const fs = require('fs');
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const MyContract = require("../client/src/contracts/Airdrop.json");
const nodemailer = require('nodemailer');
const { default:  axios } = require('axios');

const express = require('express');
const cors = require('cors');
const app = express()

const urlKeys = ['Q7QXTMXCWNJ7HK742I6WG77VUNEIRH12UB']
const mailer = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } })
// TODO: replace wss with https
const providerOrUrl = 'https://bsc-dataseed.binance.org/';
// create web3 instance
let provider = new Provider({ mnemonic: { phrase: process.env.MAINNET_MNEMONIC }, providerOrUrl });
const web3 = new Web3(provider);
// load contract abi
const chainId = 56;
const deployedNetwork = MyContract.networks[chainId]
const AirdropContract = new web3.eth.Contract(MyContract.abi, deployedNetwork && deployedNetwork.address)

app.use(express.json({ limit: "50mb" }));
// Add headers before the routes are defined
app.use(cors())

function statusLogger(status = 1, message) {
  try {
    if (fs.readFileSync('./server/status.log')) {
      if (status == 2) {
        fs.appendFileSync('./server/status.log', `Request Options: ${message.protocol}:/${message.method} - ${message.originalUrl}\n`)
      } else {
        fs.appendFileSync('./server/status.log', `Status Code: ${status}, Message: ${message}\n`)
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}

function middleware(req, res, next) {
  statusLogger(2, req)
  verifyApiKey(req, res, next)
}

function verifyApiKey(req, res, next) {
  const apiKey = req.body.apiKey || req.query.apiKey || req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(200).send("An api key is required for authentication");
  }
  if(urlKeys.find(x => x === apiKey)) {
    return next()
  } else {
    return res.status(200).send("Invalid Token");
  }
}

// ========== ACCOUNT ROUTES =============
app.post('/transfer-token', middleware, async function(req, res) {
  const accounts = await web3.eth.getAccounts();
  const { transferTo, amount, tokenaddress, bscapi } = req.body;

  if(!(transferTo && amount && tokenaddress, bscapi)) {
    res.status(400).json({ status: 0, message: 'Incomplete request' })
  }
  try {
    const response = await axios.get(`https://api.bscscan.com/api?module=contract&action=getabi&address=${tokenaddress}&apikey=${bscapi}`)
    const { data } = response
    var contractABI = "";
    contractABI = JSON.parse(data.result);
    if (contractABI != '') {
      var thisTokenContract = new web3.eth.Contract(contractABI, tokenaddress);
      await thisTokenContract.methods.transfer(transferTo, web3.utils.toWei(`${amount}`, 'ether')).send({ from: accounts[0] })
      statusLogger(1, 'Claimed tokens')
      res.status(200).json({ status: 0, message: 'Claimed Tokens' })
    } else {
      let message = 'Error: could\' get contract abi';
      statusLogger(0, message)
      res.status(400).json({ status: 0, message })
    }
  } catch(error) {
    statusLogger(0, error.message)
    res.status(400).json({ status: 0, message: error.message })
  }
})

app.post('/transfer-ether', middleware, async function(req, res) {
  const accounts = await web3.eth.getAccounts();
  const { transferTo, amount } = req.body;

  if(!(transferTo && amount)) {
    res.status(400).json({ status: 0, message: 'Incomplete request' })
  }

  let amountToSend = amount - ( amount * 0.05 )
  const rawTransaction = { from: accounts[0], to: transferTo, value: web3.utils.toWei(`${amountToSend}`, 'ether') }
  web3.eth.sendTransaction(rawTransaction).then((reciept) => {
    if(reciept && reciept.status === true) {
      res.send(200).json({ status: 1, message: 'Refunded '+ amountToSend })
    }else {
      statusLogger(0, reciept.toString())
      res.status(400).json({ status: 0, message: 'An error occurred, try again later' })
    }
  }).catch((error) => {
    statusLogger(0, error.message)
    res.status(400).json({ status: 0, message: error.message })
  });
})
// ========== END ACCOUNT ROUTES =============



// =========== AIRDROP ROUTES =============
app.post('/set-airdrop-token', middleware, async function(req, res) {
  let accounts = await web3.eth.getAccounts();
  const { tokenaddress } = req.body;

  if (!tokenaddress) {
    res.status(400).send('Invalid route')
  }

  try {
    const r = await AirdropContract.methods.setTokenAddress(tokenaddress).send({ from: accounts[0] })
    console.log(r);
    res.status(200).json({ status: 1, message: 'approved!' })
  } catch (error) {
    statusLogger(0, error.message)
    res.status(400).send(error.message)
  }
})

app.post('/airdrop-tokens', middleware, async function(req, res) {
  let accounts = await web3.eth.getAccounts();
  const { distributionList, tokensperuser, creatorEmail } = req.body;

  let completedList = [];
  let uncompletedList = [];
  console.log('From airdrop: ', await AirdropContract.methods.owner().call());
  for (let index = 0; index < distributionList.length; index++) {
    let gasPrice = 6;
    const element = distributionList[index];
    try {
      console.log('Airdrop started');
      let r = await AirdropContract.methods.dropTokens(element, web3.utils.toWei(`${tokensperuser}`, 'ether')).send({ from: accounts[0] });
      completedList.push(...element);
      console.log('------------------------');
      console.log("Allocation + transfer was successful.", r.gasUsed, "gas used. Spent: ", r.gasUsed * gasPrice, "wei");
      console.log('----------DONE----------');
      break;
    } catch (error) {
      statusLogger(0, error.message)
    }
  }
  
  // check completed or not
  distributionList.forEach(x => uncompletedList.push(...x.filter(item => !completedList.includes(item))))
  const mailOptions = { from: process.env.GMAIL_USER, to: creatorEmail, subject: 'Airdrop status from StrataLaunch' };
  if (uncompletedList.length > 0) {
    // send email with failed addresess and the status
    mailer.sendMail({ ...mailOptions, text: 'Airdrop for: '+uncompletedList.join() + 'failed! - Reason: insufficient allowance or Invalid addresses, try again with those addresses' }, (err, info) => {
      if(err) statusLogger(0, err.message)
      else statusLogger(1, 'Mail sent: '+info.response.toString())
    })
  } else {
    // send email that airdrop was success
    mailer.sendMail({ ...mailOptions, text: 'Airdrop for '+completedList.length + 'addresses completed successfully' }, (err, info) => {
      if(err) statusLogger(0, err.message)
      else statusLogger(1, 'Mail sent: '+info.response.toString())
    })
  }

  res.status(200).json({ status: 1, message: 'Dropping Tokens!' })
})
// =========== END AIRDROP ROUTES =============

// default route
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;