const exchanges = [
  // chainId 0x38 = 56 -> bsc mainet
  // chainId 0x61 = 97 -> bsc testnet
  { 
    name: 'PancakeSwap', 
    network: 'Binance Smart Chain', 
    logo:1, 
    chainId: process.env.REACT_APP_SITE_NAME === 'DEV' ? 97 : 56
  },
  { name: 'UniSwap', network: 'Etheruem network', logo:2, disabled:true, chainId: 1 }
]

export const metamaskInitialState = {
  web3: null,
  accounts: []
}

export const tokensAndPairsInitialState = {
  loaded: false,
  tokens: []
}

export const launchPadInitialState = {
  exchanges,
  defaultChainId: process.env.REACT_APP_SITE_NAME === 'DEV' ? 97 : 56
}