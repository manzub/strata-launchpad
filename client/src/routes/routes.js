import React, { lazy } from 'react';
import { authPages, dashboardPages } from '../static/menu';
// import Login from '../pages/auth/Login';

const AUTH = {
  PAGE_404: lazy(() => import('../pages/auth/Page404'))
}

const DASHBOARD = {
  DASHBOARD: lazy(() => import('../pages/dashboard/Dashboard')),
  TOKENS: lazy(() => import('../pages/dashboard/TokensPage')),
  LAUNCHPAD: lazy(() => import('../pages/dashboard/LaunchPage')),
  TOKENSINGLE: lazy(() => import('../pages/dashboard/SingleToken')),
  AIRDROP: lazy(() => import('../pages/dashboard/Airdrop')),
}

const routes = [
  {
    path: dashboardPages.dashboard.path,
    element: <DASHBOARD.DASHBOARD/>,
    exact: true
  },
  {
    path: `dashboard/tokens/:filter`,
    element: <DASHBOARD.TOKENS/>,
    exact: true
  },
  {
    path: dashboardPages.launchpad.path,
    element: <DASHBOARD.LAUNCHPAD/>,
    exact: true
  },
  {
    path: dashboardPages.singleToken.path,
    element: <DASHBOARD.TOKENSINGLE/>,
    exact: true
  },
  {
    path: dashboardPages.airdropToken.path,
    element: <DASHBOARD.AIRDROP/>,
    exact: true
  },
  // page not found route
  {
    path: authPages.page404.path,
    element: <AUTH.PAGE_404/>,
    exact: true
  },
]

const contents = [...routes];

export default contents;