const path = window.location.pathname.replace(/\/+$/, '') || '/'

export const isLoginPage = path === '/login'

/** The public demo (/demo): no login, everything happens on the shared demo account. */
export const isDemo = path === '/demo'

/** Full page loads between login, app and demo: nothing (cached data included) carries over from one to the next. */
export const goToLogin = () => {
  if (!isLoginPage) window.location.replace('/login')
}

export const goToApp = () => window.location.replace('/')
