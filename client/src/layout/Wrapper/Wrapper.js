import React, { useCallback, useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Content from '../Content/Content';
import WrapperOverlay from './WrapperOverlay';

import ThemeContext from '../../contexts/themeContext';
import { DashboardHeader } from '../Header/HeaderRight';
import { connectMetaMask, updateAccounts } from '../../redux/actions';
import Toasts from '../../components/bootstrap/Toasts';
import { useDispatch, useSelector } from 'react-redux';
import { useToasts } from 'react-toast-notifications';
import { metamaskInitialState } from '../../redux/initialState';
import Modal, { ModalBody } from '../../components/bootstrap/Modal';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';

export const WrapperContainer = ({ children, className, ...props }) => {
	const { rightPanel } = useContext(ThemeContext);
	return (
		<div
			className={classNames(
				'wrapper',
				{ 'wrapper-right-panel-active': rightPanel },
				className,
			)}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...props}>
			{children}
		</div>
	);
};
WrapperContainer.propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};
WrapperContainer.defaultProps = {
	className: null,
};

const Wrapper = () => {
  const { addToast } = useToasts();

  const { metamask, launchPadInfo } = useSelector(state => state);
  const dispatch = useDispatch()


  const [networksChanged, setModalStatus] = useState(false);
  const [waitingAsync, setWaitingAsync] = useState(false);

  const notify = useCallback(
    (message) => addToast(
      <Toasts icon={'Warning'} title='Metamask Info'>
        <span>{message}</span>
      </Toasts>,
      { autoDismiss: false }
    ), [addToast]
  )

  useEffect(() => {

    if (metamask.web3 && metamask.accounts[0]) {
      // TODO: ask user to change accounts
      // listen for changes after connection
      window.ethereum.on('accountsChanged', function(updatedAccounts) {
        if (metamask.accounts[0]) {
          if (!!updatedAccounts[0] && metamask.accounts[0] !== updatedAccounts[0]) {
            notify('Account changed in metamask')
            dispatch(updateAccounts(updatedAccounts))
          } else dispatch(connectMetaMask(metamaskInitialState)) 
        }
      })

      // listen for network change
      const oldChainId = metamask.web3.eth.getChainId();
      window.ethereum.on('networkChanged', function(chainId) {
        if (oldChainId !== chainId) {
          if (chainId !== launchPadInfo.defaultChainId) {
            // notify user of network change
            setModalStatus(!networksChanged)
          }
        }
      })
    }
  }, [dispatch, metamask, addToast, notify, launchPadInfo, networksChanged])

  const switchToMainnet = async () => {
    setWaitingAsync(true)
    const chainId = metamask.web3.eth.getChainId();
    if (chainId !== launchPadInfo.defaultChainId) {
      let str = launchPadInfo.defaultChainId.toString(16)
      const toHex = `0x${str}`;
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex }],
      })
      if(chainId === launchPadInfo.defaultChainId) {
        setWaitingAsync(false)
        setModalStatus(false)
      }
    }
  }

	return (
		<>
			<WrapperContainer>
				<DashboardHeader/>
        <Content />

        {/* notify network change modal */}
        <Modal 
            isOpen={networksChanged} 
            setIsOpen={() => setModalStatus(!networksChanged)} 
            isStaticBackdrop={true}
            isCentered={true} >
              <ModalBody className='text-center'>
                <Icon color={'warning'} size={'5x'} icon={'warning'} />
                <h3>Network Change Detected</h3>
                <p className='text-muted'>{process.env.REACT_SITE_APP_NAME} noticed a change in metamask network, 
                please connect back to the BSC Mainnet from your metamask to continue or click here</p>
                <Button disabled={waitingAsync} onClick={switchToMainnet} rounded={0} isLight isOutline color={'primary'}>Switch network</Button>
              </ModalBody>
          </Modal>
			</WrapperContainer>
			<WrapperOverlay />
		</>
	);
};

export default Wrapper;