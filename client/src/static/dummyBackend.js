export const coinStats = ['live', 'completed', 'awaiting start', 'failed']
export async function dummyAllCoins(count) {
  await new Promise(resolve => setTimeout(resolve, 1500))
  const response = [];
  let colors = ['primary', 'success', 'info']
  let pairs = ['WBNB','BNB','BUSB']

  for (let index = 0; index < count; index++) {
    let hardCap = Math.floor(Math.random() * (index + 10**2))
    const element = {
      name: 'random name '+index,
      symbol: 'rn'+index,
      pair: pairs[Math.floor(Math.random() * pairs.length)],
      icon: 'Circle',
      hardCap,
      currentCap: Math.floor((hardCap / (index + 1)) * (index + 1)/2),
      color: colors[Math.floor(Math.random() * colors.length)],
      address: Math.random().toString(36).substring(2, 15),
      status: coinStats[Math.floor(Math.random() * coinStats.length)],
      participants: index + 100,
      amountToSell: index+1 * 10**3,
      startDate: '2021-12-23 07:15:31',
      presaleEndDate: '2022-01-08 16:01:31',
      maxContributions: '1',
      presaleCreator: (index % 2) === 0 ? "0x647D539FE3d1D778b9788Cc182094fe8f9e3eBdC" : "sdwed232dw"
    }
    response.push(element);
  }

  return response
}

export const dummyToken = {
  "status":"1",
  "message":"OK",
  "result":[
     {
        "contractAddress":"0x5bE6eC9a5d1EF8390d22342EDA90E2Fc6F1A9f7d",
        "tokenName":"Strata Today",
        "symbol":"Strata",
        "divisor":"8",
        "tokenType":"BEP20",
        "totalSupply":"22000000.00000000",
        "blueCheckmark":"true",
        "description":"StrataToday is a yield farming project whereby users can get FLIP (LP token) for staking and get CAKE token as reward.",
        "website":"https://pancakeswap.finance/",
        "email":"PancakeSwap@gmail.com",
        "blog":"https://medium.com/@pancakeswap",
        "reddit":"",
        "slack":"",
        "facebook":"",
        "twitter":"https://twitter.com/pancakeswap",
        "bitcointalk":"",
        "github":"https://github.com/pancakeswap",
        "telegram":"https://t.me/PancakeSwap",
        "wechat":"",
        "linkedin":"",
        "discord":"",
        "whitepaper":"",
        "tokenPriceUSD":"2.9300000000"
     }
  ]
}