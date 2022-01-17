import React, { useContext } from 'react';
import Button from '../../components/bootstrap/Button';
import Nav, { NavItem } from '../../components/bootstrap/Nav';
import ThemeContext from '../../contexts/themeContext';
import useDarkMode from '../../hooks/useDarkMode';
import Header, { HeaderLeft, HeaderRight } from './Header';
import Popovers from '../../components/bootstrap/Popovers';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import ConnectWalletButton from './ConnectButton';

import './header.css'
import { useDispatch } from 'react-redux';
import { fetchTokensThunk } from '../../redux/thunks';
import { loadingTokens } from '../../redux/actions';

const navigations = {
  id: 'components',
  navigationMenu: {
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
  }
}

export const DashboardHeader = () => {
  const { mobileDesign } = useContext(ThemeContext);

  return(<Header>
    <HeaderLeft>
      <div className='brandname'>
        <h5>Strata Launchpad</h5>
        <Nav className='justify-content-center' design='pills' isVertical={mobileDesign} >
          { Object.keys(navigations.navigationMenu).map( item => (
            <NavItem key={navigations.navigationMenu[item].path}>
              <NavLink to={navigations.navigationMenu[item].path}>{navigations.navigationMenu[item].text}</NavLink>
            </NavItem>
          ) ) }
        </Nav>
      </div>
    </HeaderLeft>
    <CommonHeaderRight />
  </Header>)
}

// eslint-disable-next-line react/prop-types
const CommonHeaderRight = ({ beforeChildren, afterChildren }) => {
  const { darkModeStatus, setDarkModeStatus } = useDarkMode();
  const dispatch = useDispatch();

  const styledButton = {
    color: darkModeStatus ? 'dark' : 'light',
    hoverShadow: 'default',
    isLight: !darkModeStatus
  }

  const refreshTokensList = () => {
    dispatch(loadingTokens())
    dispatch(fetchTokensThunk())
  }

  return(<HeaderRight>
    <div className='row g-3'>
    {beforeChildren}
				{/* Dark Mode */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Dark / Light mode'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledButton}
              size='lg'
							icon={darkModeStatus ? 'DarkMode' : 'LightMode'}
							onClick={() => setDarkModeStatus(!darkModeStatus)}
							aria-label='Toggle dark mode'
							data-tour='dark-mode'
						/>
					</Popovers>
				</div>

        {/* connect wallet button goes here */}
        <div className='col-auto'>
          <Popovers trigger='hover' desc='Connect Wallet'>
            <ConnectWalletButton />
          </Popovers>
        </div>

        {/* account button */}
        <div className='col-auto'>
          <Popovers trigger='hover' desc='Refresh Presales'>
            <Button onClick={refreshTokensList} size='lg' {...styledButton} icon={'Refresh'} aria-label='Refresh' />
          </Popovers>
        </div>
    </div>
  </HeaderRight>);
}
CommonHeaderRight.propTypes = {
	beforeChildren: PropTypes.node,
	afterChildren: PropTypes.node,
};
CommonHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default CommonHeaderRight;