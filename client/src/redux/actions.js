import { CONNECT_METAMASK, FETCH_TOKENS, LOADING, UPDATE_ACCOUNT } from "./constants"

export const updateAccounts = payload => {
  return { type: UPDATE_ACCOUNT, payload }
}

export const connectMetaMask = payload => {
  return { type: CONNECT_METAMASK, payload }
}

export const fetchTokens = payload => {
  return { type: FETCH_TOKENS, payload }
}

export const loadingTokens = () => {
  return { type: LOADING, payload: null }
}