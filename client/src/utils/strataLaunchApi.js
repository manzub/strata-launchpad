const { default:  axios } = require('axios');

const baseUrl = process.env.REACT_APP_BACKEND_API_STRATA;
const airdropApi = process.env.REACT_APP_BACKEND_API_LAUNCHPAD;
const apiKey = process.env.REACT_APP_BACKEND_KEY

export const devaddress = process.env.REACT_APP_DEV_ADDRESS;

const strataLyApi = {
  // strataLaunch routes
  async allPresales() {
    const url = baseUrl + '/tokens/all'
    const response = await axios.get(url)
    const { status, data } = response.data
    if (status === "1") return data
    return []
  },
  async myContributions({ useraddress, tokenaddress }) {
    const url = baseUrl + `/tokens/contribute/${tokenaddress}/${useraddress}`
    const response = await axios.get(url)
    const { status, data } = response.data
    if (status === "1") return { status, result: { contributions: data.contributedFunds, status: data.status } }
    return { status, message: response.data.message }
  },
  async contributeToPresale({ tokenaddress, contribution, useraddress }) {
    const url = baseUrl + '/tokens/contribute'
    const response = await axios.post(url, { tokenaddress, contributedFunds: contribution, contributedUserAddress: useraddress })
    const { status } = response.data
    if (status === "1") return {status}
    return { status, message: response.data.message }
  },
  async ClaimRefundContributions({ useraddress, tokenaddress, option }) {
    const url = baseUrl + `/tokens/contribution/${useraddress}/${tokenaddress}/${option}`;
    const response = await axios.get(url)
    const { status } = response.data;
    if(status === "1") return { status }
    return response.data
  },
  async createPresale(props) {
    const url = baseUrl + '/tokens/create'
    const response = await axios.post(url, props)
    const { status } = response.data
    if (status === "1") return { status }
    return response.data
  },
  async modifyPresale(props) {
    const url = baseUrl + '/tokens/update';
    const response = await axios.post(url, props)
    const { status } = response.data;
    if(status === "1") return { status }
    return response.data
  },
  async publishOrFail({ tokenaddress, option }) {
    const url = baseUrl + `/tokens/publish/${tokenaddress}/${option}`;
    const response = await axios.get(url)
    const { status } = response.data;
    if(status === "1") return { status }
    return response.data
  },
  async refundPresaleCreator({ tokenaddress, option }) {
    const url = baseUrl + `/tokens/refund/${tokenaddress}/${option}`;
    const response = await axios.get(url)
    const { status } = response.data;
    if(status === "1") return { status }
    return response.data
  },
  async addToWhitelist(data) {
    const url = baseUrl + `/tokens/whitelist`
    const response = await axios.post(url, data)
    return response.data
  },
  // strataLaunchApi1 routes
  async setTokenAddress(props) {
    const url = airdropApi + '/set-airdrop-token';
    const response = await axios.post(url, props, { headers: { "x-api-key": apiKey } })
    return response.data
  },
  async dropTokens(props) {
    const url = airdropApi + '/airdrop-tokens';
    const response = await axios.post(url, props, { headers: { "x-api-key": apiKey } })
    return response.data
  },
  // strataLaunchApi2 rotues
  async transferToken(props) {
    const url = airdropApi + '/transfer-token';
    const response = await axios.post(url, { ...props, bscapi: process.env.REACT_APP_BSC_APIKEY }, { headers: { "x-api-key": apiKey } })
    return response.data
  },
  async transferEther(props) {
    const url = airdropApi + '/transfer-ether';
    const response = await axios.post(url, props, { headers: { "x-api-key": apiKey } })
    return response.data
  }
}

export default strataLyApi;