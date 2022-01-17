import React, { useEffect, useLayoutEffect } from 'react';
import { ThemeProvider } from 'react-jss';
import ReactNotification from 'react-notifications-component';
import { ToastProvider } from 'react-toast-notifications';

import Wrapper from '../layout/Wrapper/Wrapper';
import Portal from '../layout/Portal/Portal';
import { Toast, ToastContainer } from '../components/bootstrap/Toasts';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTokensThunk } from '../redux/thunks';
import Loading from '../components/Loading';

function App() {
  getOS();

  // fetch all coins and add to state before load complete
  const { tokensAndPairs } = useSelector(state => state);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTokensThunk())
  }, [dispatch])

  /**
	 * Dark Mode
	 */
	const { themeStatus, darkModeStatus } = useDarkMode();
	const theme = {
		theme: themeStatus,
		primary: COLORS.PRIMARY.code,
		secondary: COLORS.SECONDARY.code,
		success: COLORS.SUCCESS.code,
		info: COLORS.INFO.code,
		warning: COLORS.WARNING.code,
		danger: COLORS.DANGER.code,
		dark: COLORS.DARK.code,
		light: COLORS.LIGHT.code,
	};
  useEffect(() => {
    if (darkModeStatus) {
			document.documentElement.setAttribute('theme', 'dark');
		}
		return () => {
			document.documentElement.removeAttribute('theme');
		};
  }, [darkModeStatus]);

  /**
	 * Modern Design
	 */
	useLayoutEffect(() => {
		if (process.env.REACT_APP_MODERN_DESGIN === 'true') {
			document.body.classList.add('modern-design');
		} else {
			document.body.classList.remove('modern-design');
		}
	});

  return (
    <ThemeProvider theme={theme}>
      <ToastProvider components={{ ToastContainer, Toast }}>
        {/* TODO: fix disabled fullscreen if needed */}
        <div>
          { tokensAndPairs.loaded ? <Wrapper/> : <Loading/> }
        </div>
        <Portal id='portal-notification'>
          <ReactNotification />
        </Portal>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;