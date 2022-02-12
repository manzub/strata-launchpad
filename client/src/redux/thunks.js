import Web3 from "web3";
import strataLaunchApi from "../utils/strataLaunchApi";
import { connectMetaMask, fetchTokens } from "./actions";

export const connectWalletThunk = () => async dispatch => {
  const web3 = new Web3(window.ethereum);
  await window.ethereum.enable();

  const chainId = await web3.eth.getChainId();
  const isLocalhost = window.location.hostname === 'localhost';
  const _chainId = isLocalhost ? '0x539' : '0x38';

  // eslint-disable-nextline
  if (!isLocalhost && chainId !== 56) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: _chainId }],
    })
  }

  
  const accounts = await web3.eth.getAccounts();
  dispatch(connectMetaMask({ web3, accounts }))
}

export const fetchTokensThunk = () => async (dispatch) => {
  const tokens = await strataLaunchApi.allPresales()

  dispatch(fetchTokens({ tokens:tokens }))
} 