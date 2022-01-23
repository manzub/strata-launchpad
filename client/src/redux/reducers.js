import { CONNECT_METAMASK, FETCH_TOKENS, UPDATE_ACCOUNT, LOADING } from "./constants";
import { tokensAndPairsInitialState, metamaskInitialState, launchPadInitialState  } from "./initialState";

export const metamaskReducer = (state = metamaskInitialState, action) => {
  switch (action.type) {
    case CONNECT_METAMASK:
      // perform action before returning new state
      return { ...state, ...action.payload }
    case UPDATE_ACCOUNT:
      return { ...state, accounts: action.payload}
    default:
      return state
  }
}

export const tokensAndPairsReducer = (state = tokensAndPairsInitialState, action) => {
  switch (action.type) {
    case FETCH_TOKENS:
      // perform action before returning new state
      return { ...state, ...action.payload, loaded: true };

    case 'UPDATE_STOCKRATES':
      return { ...state, stock_rates: action.payload }
    case LOADING: 
      return { ...state, loaded: false }
    default:
      return state;
  }
}

export const launchPadInfoReducer = (state = launchPadInitialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
}