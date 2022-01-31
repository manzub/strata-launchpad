import React, { createRef, forwardRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useClipboard } from 'use-clipboard-copy';
import Button from '../../components/bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import showNotification from '../../components/extras/showNotification';
import Icon from '../../components/icon/Icon';
import useDarkMode from '../../hooks/useDarkMode';
import { hideAddress } from '../../methods';
import { connectMetaMask } from '../../redux/actions';
import { metamaskInitialState } from '../../redux/initialState';

import { connectWalletThunk } from '../../redux/thunks'

const ConnectWalletButton = forwardRef(() => {
  const { darkModeStatus } = useDarkMode();
  const clipboard = useClipboard();

  const metamask = useSelector( state => state.metamask )
  const dispatch = useDispatch();
  // connected wallet state
  const [connected, setConnectionStatus] = useState(!!metamask.accounts[0]);
  const [modalStatus, setModalStatus] = useState(false);
  // wallet address ref
  const ref = createRef();
  const balanceRef = createRef();

  const styledButton = {
    color: darkModeStatus ? 'dark' : 'light',
    hoverShadow: 'default',
    isLight: !darkModeStatus
  }

  // if not connected -> connect to metamask
  const handleConnectButtonClick = (disconnect = false) => {
    if (!connected) {
      dispatch(connectWalletThunk())
      setConnectionStatus(!connected)
      // !!metamask.accounts[0] && setConnectionStatus(!connected)
    }
    connected && setModalStatus(true)

    if (disconnect && connected) {
      dispatch(connectMetaMask(metamaskInitialState))
      setConnectionStatus(!connected)
      setModalStatus(!modalStatus)
    }
  }

  useEffect(() => {
    ref.current.innerHTML = !!metamask.accounts[0] ? hideAddress(`${metamask.accounts[0]}`) : 'connect wallet';
    const fetchBalance = async () => {
      const balance = await metamask.web3.eth.getBalance(metamask.accounts[0])
      if (modalStatus) {
        if(balanceRef.current) {
          balanceRef.current.innerHTML = !!metamask.web3 ? `${metamask.web3.utils.fromWei(balance, 'ether')} BNB` : '0 BNB';
        }
      }
    }
    metamask.web3 && fetchBalance();
  })


  return(<>
    <Button 
      className='text-muted' 
      style={{border:'1px solid #444'}} 
      {...styledButton} 
      icon={'SwapVert'} 
      aria-label='Connect Wallet'
      onClick={() => handleConnectButtonClick()}
    >
      <span ref={ref}>connect wallet</span>
    </Button>

    {/* modal view */}
    <Modal
      id='random-id'
      isOpen={modalStatus}
      setIsOpen={() => setModalStatus(!modalStatus)}
      isCentered={true}
      isAnimation={true}
    >
      <ModalHeader setIsOpen={() => setModalStatus(!modalStatus)}>
        <ModalTitle id='random-id'>
          <p className='text-muted'>connection type <strong className='svg-badge'>MetaMask</strong></p>
          Your wallet
        </ModalTitle>
      </ModalHeader>

      <ModalBody style={{padding:0}}>
        <div style={{padding:20}} className='bg-primary d-flex align-items-center justify-content-between'>
          <h4 style={{margin:0}}>
            <strong ref={ref}>wallet address</strong>
            <Icon style={{cursor:'pointer'}} icon={'ContentCopy'} onClick={() => {
              clipboard.copy(metamask.accounts[0]);
              showNotification(
                'Copied to Clipboard',
                <div className='row d-flex align-items-center'>
                  <div className='col-auto h5'>{metamask.accounts[0]}</div>
                </div>,
              );
            }} />
          </h4>
          <h5 ref={balanceRef} style={{margin:0}}>0 BNB</h5>
        </div>
        <p style={{marginTop:10}} className='text-center'>StrataLaunch works best with MetaMask on all chains.</p>
      </ModalBody>

      <ModalFooter>
        <Button 
          isOutline={true}
          color='primary'
          rounded={0}
          onClick={() => handleConnectButtonClick(true)}
        >Disconnect Wallet</Button>
      </ModalFooter>
    </Modal>
  </>)
})

export default ConnectWalletButton