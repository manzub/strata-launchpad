export const dashboardPages = {
  dashboard: {
    id: 'dashboard',
    text: 'Dashboard',
		path: '/',
    icon: 'Home'
  },
  tokens: {
    id: 'tokens',
    text: 'Tokens',
    path: 'dashboard/tokens/live',
    icon: 'Cases'
  },
  launchpad: {
    id: 'launchpad',
    text: 'Launchpad',
    icon: 'CloudUpload',
    path: 'dashboard/launchpad'
  },
  singleToken: {
    id: 'singleToken',
    text: 'Token Info',
    icon: 'Circle',
    path: 'dashboard/token/:address'
  },
  airdropToken: {
    id: 'airdropTokens',
    text: 'Airdrop',
    icon: 'Share',
    path: 'dashboard/airdrop'
  }
}

export const authPages = {
  auth: {
		id: 'auth',
		text: 'Auth Pages',
		icon: 'Extension',
	},
	login: {
		id: 'login',
		text: 'Login',
		path: 'auth-pages/login',
		icon: 'Login',
	},
	signUp: {
		id: 'signUp',
		text: 'Sign Up',
		path: 'auth-pages/sign-up',
		icon: 'PersonAdd',
	},

	page404: {
		id: 'Page404',
		text: '404 Page',
		path: 'auth-pages/404',
		icon: 'ReportGmailerrorred',
	},
}

export const combineMenu = { ...dashboardPages, ...authPages }