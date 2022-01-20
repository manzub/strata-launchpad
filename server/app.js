require('dotenv').config();
const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const MyContract = require("../client/src/contracts/Airdrop.json");

const express = require('express');
const cors = require('cors');
const app = express()

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

app.post('/set-airdrop-token', async function(req, res) {
  let accounts = await web3.eth.getAccounts();
  const { tokenaddress } = req.body;

  if (!tokenaddress && amount) {
    res.status(400).send('Invalid route')
  }

  try {
    const r = await AirdropContract.methods.setTokenAddress(tokenaddress).send({ from: accounts[0] })
    console.log(r);
    res.status(200).json({ status: 1, message: 'approved!' })
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message)
  }
})

app.post('/airdrop-tokens', async function(req, res, next) {
  let accounts = await web3.eth.getAccounts();
  const { distributionList, tokensperuser, creatorEmail } = req.body;
  // TODO: set a filter array, every successful airdrop, add to the filter array
  // after completion if the addresses is not in filter array, start airdrop again,
  // else email user about the error and possible retry
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
      break;
    } catch (error) {
      console.log(error);
    }
  }
  
  // check completed or not
  distributionList.forEach(x => uncompletedList.push(...x.filter(item => !completedList.includes(item))))
  if (uncompletedList.length > 0) {
    // send email with failed addresess and the status
  } else {
    // send email that airdrop was success
  }

  res.status(200).json({ status: 1, message: 'Dropping Tokens!' })
})

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