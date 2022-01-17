import { dummyToken } from './dummyBackend';

const queryString = require('query-string');
const { default:  axios } = require('axios');

const apiKey = 'Q7QXTMXCWNJ7HK742I6WG77VUNEIRH12UA';
const url = 'https://api.bscscan.com/api';

const exports =  {
  async fetchApi(props) {
    let params = queryString.stringify({apiKey: apiKey, ...props})
    if (props.action === 'tokeninfo') return dummyToken
    const response = await axios.get(`${url}?${params}`)
    return response.data
  }
}


export default exports