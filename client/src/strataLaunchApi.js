const { default:  axios } = require('axios');

const baseUrl = 'https://accounts.strata.ly/api'
export const devaddress = "0x76d96AaE20F26C40F1967aa86f96363F6907aEAB";

const strataLyApi = {
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
    if (status === "1") return { status, contributions: data.contributedFunds }
    return { status, message: response.data.message }
  },
  async contributeToPresale({ tokenaddress, contribution, useraddress }) {
    const url = baseUrl + '/tokens/contribute'
    const response = await axios.post(url, { tokenaddress, contributedFunds: contribution, contributedUserAddress: useraddress })
    const { status } = response.data
    if (status === "1") return {status}
    return { status, message: response.data.message }
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
  }
}

export default strataLyApi;