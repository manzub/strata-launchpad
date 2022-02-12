import bscScanApi from "./bscScanApi";

export function hideAddress(account) {
  let part1 = account.substr(0, 6)
  let part2 = account.substr(account.length - 4, account.length)

  return `${part1}...${part2}`
}

export function dateToString(date, type = 1) {
  const dateObj = date === null ? new Date() : new Date(date);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = dateObj.getMonth();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  const nth = function(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  }

  switch (type) {
    case 2:
      var _day = `${day}`+nth(day);
      return `${_day} ${monthNames[month]} ${year}`
    default:
      let month_str = month < 10 ? `0${month+1}` : month+1
      return `${year}-${month_str}-${day}`
  }
}

export function statusToText(status) {
  if (status === "0") return 'awaiting start'
  if (status === "1") return 'live'
  if (status === "2") return 'completed'
  if (status === "all") return 'all'
  return 'failed'
}

export async function baseTokenAbi(option) {
  const baseTokens = {
    strataToday: '0x5bE6eC9a5d1EF8390d22342EDA90E2Fc6F1A9f7d',
    arata: '0xD07E591E10E41b6B08457C8aa0be6b79369D60a6'
  }
  const tokenaddress = baseTokens[option]
  try {
    const response = await bscScanApi.fetchApi({ module: 'contract', action: 'getabi', address: tokenaddress })
    if (response.status === '1') {
      let abi = response.result
      var contractAbi = JSON.parse(abi)
      return { status: response.status, contractAbi, tokenaddress };
    } else throw new Error(response.result)
  } catch (error) {
    return { status: 0, message: error.message }
  }
}