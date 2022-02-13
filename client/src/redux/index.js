import { launchPadInfoReducer, metamaskReducer, tokensAndPairsReducer } from "./reducers";
import { applyMiddleware, combineReducers, compose, createStore } from '@reduxjs/toolkit'
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

const allReducers = combineReducers({
  metamask: metamaskReducer,
  tokensAndPairs: tokensAndPairsReducer,
  launchPadInfo: launchPadInfoReducer
})

const store = createStore(allReducers, compose(applyMiddleware(thunk)))
// const store = createStore(allReducers, compose(applyMiddleware(thunk), composeWithDevTools()))

export default store