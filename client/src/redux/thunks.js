import Web3 from "web3";
import strataLaunchApi from "../utils/strataLaunchApi";
import { connectMetaMask, fetchTokens } from "./actions";

async function getWeb3() {
  if(window.ethereum) {
    // Modern dApp browsers
    console.log('Injected web3 detected (Modern dApp)');
    let instance = new Web3(window.ethereum);
    try {
      await window.ethereum.enable();
    } catch (error) {
      console.log(error);
    }
    return instance
  } else if (window.web3) {
    // for Legacy dApp browswers
    console.log('Injected web3 detected (Legacy dApp)');
    return window.web3
  } else {
    // connect directly to mainnet
    // const provider = new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/')
    // console.log('No web3 instance injected, using default mainnet url');
    // return new Web3(provider);
    alert('this platform only works with Metamask or other web3 providers installed on your browser')
  }
}

export const connectWalletThunk = () => async dispatch => {
  const web3 = await getWeb3();

  const chainId = await web3.eth.getChainId();
  const isLocalhost = window.location.hostname === 'localhost';
  const _chainId = isLocalhost ? '0x539' : '0x38';

  // eslint-disable-nextline
  if (!isLocalhost && chainId !== 56) {
    if(window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: _chainId }],
      })
    }
  }

  
  const accounts = await web3.eth.getAccounts();
  dispatch(connectMetaMask({ web3, accounts }))
}

export const fetchTokensThunk = () => async (dispatch) => {
  const tokens = await strataLaunchApi.allPresales()

  dispatch(fetchTokens({ tokens:tokens }))
} 