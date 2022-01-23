import { dummyToken } from './dummyBackend';

const queryString = require('query-string');
const { default:  axios } = require('axios');

const apiKey = process.env.REACT_APP_BSC_APIKEY;
const url = 'https://api.bscscan.com/api';

const bscScanApi =  {
  async fetchApi(props) {
    let params = queryString.stringify({apiKey: apiKey, ...props})
    if (props.action === 'tokeninfo') return dummyToken
    const response = await axios.get(`${url}?${params}`)
    return response.data
  },
  async coinApiMarketRate() {
    let result = { bitcoin: 0, binance: 0, ethereum: 0 }
    const path = `https://rest.coinapi.io/v1/exchangerate/`
    let headers = { 'X-CoinAPI-Key': process.env.REACT_APP_COIN_APIKEY }
    const response = await axios.get(path+'BTC/USD', { headers: headers })
    if (response.data) {
      result.bitcoin = parseFloat(response.data.rate).toFixed(2)

      result.ethereum = parseFloat(await (await axios.get(path+'ETH/USD', { headers: headers })).data.rate).toFixed(2)
      result.binance = parseFloat(await (await axios.get(path+'BNB/USD', { headers: headers })).data.rate).toFixed(2)
    }

    return result;
  }
}


export default bscScanApi