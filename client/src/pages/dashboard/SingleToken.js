import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardActions, CardHeader, CardLabel, CardTitle, CardBody } from '../../components/bootstrap/Card';
import Badge from '../../components/bootstrap/Badge';
import Accordion, { AccordionItem } from '../../components/bootstrap/Accordion';
import Alert, { AlertHeading } from '../../components/bootstrap/Alert'
import Button from '../../components/bootstrap/Button'
import Icon from '../../components/icon/Icon';
import Progress from '../../components/bootstrap/Progress';
import classNames from 'classnames';
import useDarkMode from '../../hooks/useDarkMode';
import { dateToString, hideAddress, statusToText } from '../../methods';
import { useClipboard } from 'use-clipboard-copy';
import showNotification from '../../components/extras/showNotification';
import InputGroup, { InputGroupText } from '../../components/bootstrap/forms/InputGroup';
import Input from '../../components/bootstrap/forms/Input';
import Tooltips from "../../components/bootstrap/Tooltips"
import strataLyApi, { devaddress } from '../../strataLaunchApi';
import bscScanApi from "../../bscScanApi";
import Toasts from '../../components/bootstrap/Toasts';
import { useToasts } from 'react-toast-notifications';
import { fetchTokensThunk } from '../../redux/thunks';
import { loadingTokens } from '../../redux/actions';


const SingleToken = () => {
  const { metamask, tokensAndPairs } = useSelector(state => state);
  const { address } = useParams();
  const { addToast } = useToasts();
  const { darkModeStatus } = useDarkMode();
  const clipboard = useClipboard();
  const dispatch = useDispatch();

  const [isPresaleCreator, setPresaleCreatorStatus] = useState(false)
  const [form, updateForm] = useState({ contribution: '0' })
  const [balance, setBalance] = useState(0)
  const [myContributions, setContributions] = useState({ contributions: 0, status: 0 })
  const [buttonStatus, setButtonStatus] = useState(true)
  const [waitingAsync, setWaitingAsync] = useState(false)
  
  const tokens = tokensAndPairs.tokens
  const currentToken = tokens.find(x => x.tokenaddress === address);

  const [creatorForm, updateCreatorForm] = useState({ startDate: dateToString(currentToken.startDate), endDate: dateToString(currentToken.presaleEndDate) })

  let badgeColor1, daysLeft;
  let presaleRate = 0;
  if (currentToken) {
    presaleRate = currentToken.amountToSell / currentToken.hardCap
    badgeColor1 = ["0", "1", "2"].includes(currentToken.status) ? 'success' : 'danger';
    // calculate time difference
    const _endDate = new Date(currentToken.presaleEndDate);
    const today = new Date();
    if (currentToken.status.toLowerCase() === '1') {
      const difference =  _endDate.getTime() - today.getTime()
      let diff_in_days = Math.round(difference / (1000 * 3600 * 24))
      if (diff_in_days > 0) daysLeft = `${diff_in_days} days left`
      else daysLeft = 'Ended'
    }
  }else {
    window.location.href = 'http://' + window.location.host
  }

  const notify = useCallback(
    (iconColor, message, title) => addToast(
      <Toasts iconColor={iconColor} icon={'Warning'} title={title}>
        <span>{message}</span>
      </Toasts>,
      { autoDismiss: false }
    ), [addToast]
  )

  const fetchMyContributions = useCallback((account) => {
    strataLyApi.myContributions({ useraddress: account, tokenaddress: currentToken.tokenaddress }).then(response => {
      if (response.status === "1") {
        setContributions({ ...response.result, contributions: parseFloat(response.result.contributions).toFixed(2) })
      }
    }).catch(err => notify('danger', 'could not fetch contributions, will try again later', 'Alert'))
  }, [currentToken, notify])

  const clearAsync = () => setWaitingAsync(false)

  useEffect(() => {
    // get additional token info from bscscan
    !currentToken.bscScanApi && bscScanApi.fetchApi({ action: 'tokeninfo', contractaddress: currentToken.tokenaddress, module: 'token' }).then(response => {
      currentToken.bscScanApi = response.result[0]
    })

    if(metamask.accounts[0]) {
      const { web3, accounts } = metamask
      // if metamask disconnected
      if(metamask.web3 === null) window.location.href = 'http://' + window.location.host
      // set presale creator status
      // TODO: revert
      if(currentToken.presaleCreator && currentToken.presaleCreator === accounts[0]) setPresaleCreatorStatus(true)
      window.ethereum.on('accountsChanged', (newAccount) => {
        setPresaleCreatorStatus(false)
        if(currentToken.presaleCreator && currentToken.presaleCreator === newAccount[0]) setPresaleCreatorStatus(true)
      })
      // get metamask wallet balance
      web3.eth.getBalance(accounts[0]).then(balance=>{
        const toEther = web3.utils.fromWei(balance, 'ether')
        const _contribution = form.contribution
  
        setButtonStatus(true)
        if(parseFloat(_contribution) <= parseFloat(toEther)) setButtonStatus(false)
        setBalance(toEther)
      })
      // get contributions made 
      !isPresaleCreator && fetchMyContributions(accounts[0])
    }
  }, [setButtonStatus, metamask, form, setPresaleCreatorStatus, currentToken, isPresaleCreator, fetchMyContributions])


  const contributePresale = async () => {
    // transfer 
    if(metamask.accounts[0]) {
      const { accounts, web3 } = metamask
      const allowance = currentToken.maxContributions -  myContributions.contributions
      const amount = form.contribution > allowance ? allowance : form.contribution;
      if (allowance > 0 && amount < allowance) {
        setButtonStatus(!buttonStatus)
        setWaitingAsync(true)
        web3.eth.sendTransaction({ from: accounts[0], to: devaddress, value: web3.utils.toWei(`${form.contribution}`, 'ether') }).then(async (reciept) => {
          if(reciept.status && reciept.transactionHash && reciept.blockHash) {
            try {
              const response = await strataLyApi.contributeToPresale({ tokenaddress: currentToken.tokenaddress, contribution: form.contribution, useraddress: accounts[0] })
              
              fetchMyContributions(accounts[0])
              if(response.status === "1") { 
                setButtonStatus(!buttonStatus)
                clearAsync()
                showNotification(
                  `Contributed #${form.contribution} to ${currentToken.tokenname}`,
                  <div className='row d-flex align-items-center'>
                    <div className='col-auto'>
                      <Icon icon={'AttachMoney'} className='h1' />
                    </div>
                    <div className='col-auto h5'>Contributed #{form.contribution} to {currentToken.tokenname}</div>
                  </div>,
                );
              }
            } catch (error) {
              notify('danger', error.message, 'Error occurred')
              clearAsync()
            }
          }
        }).catch(err => {
          notify('danger', err.message, 'Error occurred')
          clearAsync()
        }) 
      }else {
        showNotification(
          `Cannot make contribution, amount exceeded allowance`,
          <div className='row d-flex align-items-center'>
            <div className='col-auto'>
              <Icon icon={'AttachMoney'} className='h1' />
            </div>
            <div className='col-auto h5'>Cannot make contribution, amount exceeded allowance</div>
          </div>,
        );
      }
    }
  }

  const updateCreatorPresale = async () => {
    setWaitingAsync(true)
    if(isPresaleCreator) {
      const { startDate, endDate } = creatorForm;
      if ((startDate && endDate) !== '') {
        // update presale
        const today = new Date()
        const presaleStartDate = new Date(startDate)
        const presaleEndDate = new Date(endDate)
        // check if presale starts today
        const difference = presaleStartDate.getTime() - today.getTime()
        let diff_in_days = Math.floor(difference / (1000 * 3600 * 24))

        if ((diff_in_days + 1) > 0) {
          // check if presale start and end has a week difference
          const difference = presaleEndDate.getTime() - presaleStartDate.getTime()
          let diff_in_days = Math.round(difference / (1000 * 3600 * 24))
          if (diff_in_days < 7) {
            clearAsync()
            notify('danger', 'Presale duration must be > a week', 'Presale error')
          } else { 
            // proceed with update
            try {
              const postParams = { startDate, presaleEndDate: endDate, tokenaddress: currentToken.tokenaddress, presaleCreator: currentToken.presaleCreator }
              const response = await strataLyApi.modifyPresale(postParams)
              if (response.status === "1") {
                notify('success', 'Presale start/endDate updated successfully', 'Presale Updated')
                notify('warning', 'Refresh presale tokens to see changes', 'Info')
                clearAsync()
              }else {
                notify('danger', 'error occurred: '+ response.message, 'Error')
                clearAsync()
              }
            } catch (error) {
              notify('danger', 'error occurred: '+ error.message, 'Error')
              clearAsync()
            }
          }
        }else {
          notify('danger', 'presale cannot start today', 'Presale error')
          clearAsync()
        }
      } else {
        notify('warning', 'No changes made', 'Info')
        clearAsync()
      }
    }
  }

  const claimTokens = async () => {
    if(metamask) {
      setWaitingAsync(true);
      const { accounts } = metamask;
      // proceed
      if(!isPresaleCreator && currentToken.published && currentToken.status === '2') {
        if(myContributions.status === 0) {
          const contributions = myContributions.contributions;
          let listingRate = currentToken.presaleRate - (currentToken.presaleRate * 0.10);
          const tokenstoclaim = contributions * listingRate;
    
          try {
            const response = await strataLyApi.transferToken({ transferTo: accounts[0], amount: tokenstoclaim, tokenaddress: currentToken.tokenaddress, bscapi:process.env.REACT_APP_BSC_APIKEY })
            if(response.status === 1) {
              await strataLyApi.ClaimRefundContributions({ useraddress: accounts[0], tokenaddress: currentToken.tokenaddress, option: 1 })
              notify(response.status === 1 ? 'info' : 'danger', response.message, 'Info')
              clearAsync()
            } else {
              throw new Error(response.message)
            }            
          } catch (error) {
            notify('warning', error.message, 'Error')
            clearAsync()
          }
        }else {
          let message = myContributions.status === 1 ? 'Already claimed Tokens' : 'Error'
          notify('warning', message, 'Error')
          clearAsync()
        }
      } else {
        notify('warning', 'Cannot claim tokens yet', 'Error')
        clearAsync()
      }
    }
  }

  const refundTokenCreator = async () => {
    if(metamask) {
      setWaitingAsync(true);
      const { accounts } = metamask;
      // proceed
      if(isPresaleCreator && !['0','1','2'].includes(currentToken.status)) {
        if(currentToken.refunded === 0) {
          const amountToClaim = currentToken.amountToSell - parseFloat(currentToken.amountToSell * 0.09)
          const bnbToClaim = currentToken.currentCap

          try { // transfer tokens
            const response = await strataLyApi.transferToken({ transferTo: accounts[0], amount: amountToClaim, tokenaddress: currentToken.tokenaddress })
            if(response.status === 1) {
              let option = 1;
              // refund bnb if isFairLaunch presale
              if(currentToken.fairLaunch === 1) {
                const r = await strataLyApi.transferEther({ transferTo: accounts[0], amount: bnbToClaim })
                if(r.status === 1) {
                  option = 2
                } else {
                  throw new Error(r.message)
                }
              }

              await strataLyApi.refundPresaleCreator({ tokenaddress: currentToken.tokenaddress, option })
              notify(response.status === 1 ? 'info' : 'danger', response.message, 'Info')
              clearAsync()
  
              setTimeout(() => {
                dispatch(loadingTokens())
                dispatch(fetchTokensThunk())
              }, 1000);
            } else {
              throw new Error(response.message)
            }
          } catch (error) {
            notify('warning', error.message, 'Error')
            clearAsync()
          }
        }else {
          currentToken.refunded === 1 && notify('danger', 'Already refunded Tokens', 'Info')
          currentToken.refunded === 2 && notify('danger', 'Fairlaunch: Already refunded Tokens & BNB', 'Info')
          clearAsync()
        }
      }
    }
  }

  // TODO: test contribute postman & refund route
  const collectRefund = async () => {
    if(metamask) {
      setWaitingAsync(true);
      const { accounts } = metamask;
      // proceed
      if(!isPresaleCreator && !['1','0'].includes(currentToken.status)) {
        if(myContributions.status === 0) {
          try {
            const response = await strataLyApi.transferEther({ transferTo: accounts[0], amount: myContributions.contributions })
            if(response.status === 1) {
              await strataLyApi.ClaimRefundContributions({ useraddress: accounts[0], tokenaddress: currentToken.tokenaddress, option: 2 })
              fetchMyContributions()
              notify(response.status === 1 ? 'info' : 'danger', response.message, 'Info')
              clearAsync()
            } else {
              throw new Error(response.message)
            }
          } catch (error) {
            notify('warning', error.message, 'Error')
            clearAsync()
          }
        }else {
          let message = myContributions.status === 1 ? 'Already Collected Refund' : 'Error'
          notify('warning', message, 'Error')
          clearAsync()
        }
      } else {
        notify('warning', 'Cannot claim tokens yet', 'Error')
        clearAsync()
      }
    }
  }

  // ====== presaleCreator only =====
  // TODO: remove liquidity after lockLiquidityFor period
  const removeLiquidity = async () => {
    if(metamask) {
      const { accounts } = metamask
      if(isPresaleCreator) {
        // calculate today > presalestartdate + lockLiquidityFor months
      }
    }
  }

  const publishOrFailToken = async (option = 1) => {
    if(currentToken.status === '2') {
      setWaitingAsync(true)
      // proceed
      try {
        await strataLyApi.publishOrFail({ tokenaddress: currentToken.tokenaddress, option })
        notify('success', option === 1 ? 'Published presale, check back in 24hrs' : 'Presale cancelled, refunding tokens', 'Info')
        clearAsync()
        // reload tokens
        setTimeout(() => {
          dispatch(loadingTokens())
          dispatch(fetchTokensThunk())
        }, 1000);
      } catch (error) {
        notify('danger', error.message, 'Error occurred')
        clearAsync()
      }
    }
  }

  return(
    <PageWrapper>
      <Page container='fluid'>
        <div className='row'>
          <div className='col-md-12'>
            <Alert 
              icon='Warning'
              isLight
              color='primary'
              borderWidth={0}
              className='shadow-3d-primary'
              isDismissible>
              <AlertHeading tag='h2' className='h4'>
                Safety Warning
              </AlertHeading>
              <span className='text-muted'>This is a decentralised and open presale platform. Similar to Uniswap anyone can create and name a presale freely including fake versions of existing tokens. It is also possible for developers of a token to mint near infinite tokens and dump them on locked liquidity. Please do your own research before using this platform.</span>
            </Alert>
          </div>
          
          <div className='col-md-12 mb-3'>
            <Card className='rounded-0'>
              <CardHeader>
                <CardLabel style={{cursor:'pointer'}} icon='ArrowBack' onClick={()=>window.history.back()}>
                  <CardTitle>Back To Tokens List</CardTitle>
                </CardLabel>
                <CardActions>
                  { !isPresaleCreator && !!metamask.accounts[0] ? (<>
                    { currentToken.status === '2' && currentToken.published === 1 && myContributions.status === 0 ? (<Button onClick={claimTokens} isDisable={waitingAsync} isLight isOutline rounded={0} color='primary' style={{padding:15,fontSize:15}}>{ waitingAsync ? 'loading...' : 'Claim Tokens' }</Button>) : null }
                    { !['0','1','2'].includes(currentToken.status) && myContributions.status === 0 && myContributions.contributions > 0 ? (<Button onClick={collectRefund} isDisable={waitingAsync} isLight isOutline rounded={0} color='warning' style={{padding:15,fontSize:15}}>{ waitingAsync ? 'loading...' : 'Refund My Contribution'}</Button>) : null }
                    { !['0', '1'].includes(currentToken.status) && myContributions.status !== 0 ? (<Badge className='text-capitalize' style={{padding:20,fontSize:15}} color='secondary' rounded={0} isLight>{ myContributions.status === 1 ? 'Claimed Tokens' : 'Collected Refund' }</Badge>) : null }
                  </>) : null }


                  { isPresaleCreator && !['0','1','2'].includes(currentToken.status) ? (<>
                    { currentToken.refunded === 0 ? (<>
                      <Button isDisable={waitingAsync} onClick={refundTokenCreator} isLight isOutline rounded={0} color='warning' style={{padding:15,fontSize:15}}>{ waitingAsync ? 'loading...' : 'Refund Presale' }</Button>
                    </>) : (<>
                      <Badge className='text-capitalize' style={{padding:20,fontSize:15}} color='secondary' rounded={0} isLight>Already claimed refunds</Badge>
                    </>)}
                  </>) : null }
                  { isPresaleCreator ? (<Badge className='p-4' style={{fontSize:15}} rounded={0} isLight color='warning'>Edit Presale</Badge>) : null }
                  <Badge className='text-capitalize' style={{padding:20,fontSize:15}} color={badgeColor1} rounded={0} isLight>{statusToText(currentToken.status)}</Badge>
                </CardActions>
              </CardHeader>

              <CardBody>
                <div className='row'>
                  <div className='col-md-6 mb-5'>
                    <div className={classNames(
                    'rounded-2 p-3',
                    {
                      'bg-dark': darkModeStatus,
                      'bg-light': !darkModeStatus
                    }
                  )}>

                    <div style={{marginTop:20}} className='d-flex align-items-center justify-content-evenly'>
                      <Icon icon={'Circle'} size='4x' />
                      <div className='token-info text-left'>
                        <h2>{currentToken.tokenname}</h2>
                        <div style={{margin:10}} className='action-links d-flex align-items-center justify-content-evenly'>
                          { currentToken.bscScanApi ? (<>
                            <a href={currentToken.bscScanApi.twitter} rel='noreferrer' target='_blank'><Icon size='2x' icon='Twitter' /></a>
                            <a href={currentToken.bscScanApi.github} rel='noreferrer' target='_blank'><Icon size='2x' icon='Globe' /></a>
                            <a href={currentToken.bscScanApi.telegram} rel='noreferrer' target='_blank'><Icon size='2x' icon='Telegram' /></a>
                          </>) : '' }
                        </div>
                        <div className='redirect-links d-flex align-items-center justify-content-between'>
                          <span style={{marginRight:20}}><a href={`https://bscscan.com/token/${currentToken.tokenaddress}`} target='_blank' rel='noreferrer'>BscScan <Icon icon='ArrowUpRight' /></a></span>
                          <span style={{cursor:"pointer"}} onClick={() => {
                            clipboard.copy(currentToken.tokenaddress)
                            showNotification(
                              'Copied to Clipboard',
                              <div className='row d-flex align-items-center'>
                                <div className='col-auto'>
                                  <Icon icon={'CardHeading'} className='h1' />
                                </div>
                                <div className='col-auto h5'>{currentToken.tokenaddress}</div>
                              </div>,
                            );
                            }}>{hideAddress(currentToken.tokenaddress)} <Icon icon='ContentCopy' /></span>
                        </div>
                      </div>
                    </div>
                    <hr />
                    <div className='capital-progress text-center'>
                      <h4 className={classNames(
                        'rounded-2',
                        {
                          'bg-dark': darkModeStatus,
                          'bg-light': !darkModeStatus
                        }
                      )} style={{padding:5}}>{parseFloat(currentToken.currentCap).toFixed(2)} / {currentToken.hardCap} <span className='text-uppercase'>{currentToken.pair}</span></h4>
                      <Progress min={0} value={currentToken.currentCap} max={currentToken.hardCap} isAutoColor isAnimated height={30} />
                    </div>
                  </div>

                  </div>
                  <div className={classNames('col-md-6 rounded-2 p-5', { 'bg-dark': darkModeStatus, 'bg-light': !darkModeStatus })}>
                    <Accordion
                    id='presale-info'
                    tag='div'
                    activeItemId={1}
                    shadow='none'
                    isFlush={true}>
                      <AccordionItem
                      id={1}
                      icon='ContactPage'
                      title='Info'
                      tag='div'
                      headerTag='h3'>
                        <h3 className='text-muted'><strong>Presale Info</strong></h3>
                        <div className='row mb-5'>
                          <div className='col-md-6'>
                            <h5>Total Raised / Hard Cap</h5>
                            <h3 className='text-primary text-uppercase'>{`${currentToken.currentCap}/${currentToken.hardCap}`} {currentToken.pair}</h3>
                          </div>
                          <div className='col-md-6'>
                            <h5>Swap Rate</h5>
                            <h3 className='text-primary text-uppercase'>1 {currentToken.pair} =&gt; {(currentToken.amountToSell/currentToken.hardCap).toFixed(2)} {currentToken.symbol}</h3>
                          </div>
                        </div>

                        {/* add presale start dates on dummy info */}
                        <div className='part-2 row mb-5'>
                          <div className='col-md-6'>
                            <h5>Presale {currentToken.status === '0' ? 'Starts' : 'Started'} on</h5>
                            <h3 className='text-primary'>{dateToString(currentToken.startDate, 2)}</h3>
                          </div>
                          <div className='col-md-6'>
                            <h5>Presale { ['2', '3'].includes(currentToken.status) ? 'Ended On' : 'Ends' }</h5>
                            <h3 className='text-primary'>{dateToString(currentToken.presaleEndDate, 2)}</h3>
                          </div>
                        </div>

                        <div className='row participants-info'>
                          <div className='col-md-6'>
                            <h5>Participants</h5>
                            <h3 className='text-primary'>{currentToken.participants}</h3>
                          </div>
                          <div className='col-md-6 mb-5'>
                            <h5>You participated with</h5>
                            <h3 className='text-primary'>{ myContributions.contributions > 0 ? `${myContributions.contributions} ${currentToken.pair}` : (<span style={{fontSize:15}} className="text-muted">-</span>) }</h3>
                          </div>
                          <div className='col-md-12'>
                            <h4 className='text-muted'>{daysLeft}</h4>
                          </div>
                        </div>
                      </AccordionItem>

                      <AccordionItem
                      id={2}
                      icon='InfoOutline'
                      title='Presale'
                      tag='div'
                      headerTag='h3'>
                        { !!!metamask.accounts[0] ? (<Button isDisable style={{width:'100%',marginBottom:20}} rounded={0} isOutline color='primary' isLight>
                          <Icon icon={'ArrowUp'} />
                          Connect your wallet to continue
                        </Button>) : (<>

                          { isPresaleCreator ? (<>

                            {/* edit presale card */}
                            <Card borderSize={1} borderColor={'warning'}>
                              <CardHeader>
                                <CardLabel className='text-muted'>
                                  <CardTitle>Edit/Update Presale</CardTitle>
                                </CardLabel>
                                <CardActions>
                                  { currentToken.status === '2' ? (<>
                                    {/* badge */}
                                    { currentToken.published !== 0 ? <>
                                      <Badge className='text-capitalize' style={{padding:10,fontSize:12}} color={badgeColor1} rounded={0} isLight>{currentToken.published === 1 ? 'Published' : 'Failed'}</Badge>
                                    </> : (<>
                                      <Tooltips isDisableElements title='Finilize and close presale'>
                                        <Button onClick={() => publishOrFailToken(1)} isDisable={currentToken.status === '2' && currentToken.published !== 0} rounded={0} isLight size='sm' color='success'>
                                          <Icon icon={'Check'} /> Publish
                                        </Button>
                                      </Tooltips>
                                      <Tooltips isDisableElements title='Cancel presale and refund contributions'>
                                        <Button onClick={() => publishOrFailToken(2)} isDisable={currentToken.status === '2' && currentToken.published !== 0} rounded={0} isLight size='sm' color='danger'>
                                          <Icon icon={'Cancel'} /> Cancel
                                        </Button>
                                      </Tooltips>
                                    </>) }
                                  </>) : null }
                                </CardActions>
                              </CardHeader>
                              <CardBody>
                                <Alert isLight={true}>
                                  <AlertHeading><Icon icon={'Info'} /> Info</AlertHeading>
                                  <ul>
                                    <li>Presale cannot be updated after presale begins</li>
                                    <li>Confirm presale status after 48hours of presale completion else all contributions will be refunded and labelled failed</li>
                                  </ul>
                                </Alert>

                                { currentToken.status === '0' ? (<>
                                  <div className='mt-3 p-3' style={{borderRadius:5, border:'1px solid #e3e3e3'}}>
                                    <h5>Add to whitelist</h5>
                                    <InputGroup>
                                      <Input 
                                      type='text'
                                      placeholder='user wallet address'/>
                                      <InputGroupText>
                                        <Button><Icon size='2x' icon='Add' /></Button>
                                      </InputGroupText>
                                    </InputGroup>
                                  </div>

                                  <div className='mt-3 p-3' style={{borderRadius:5, border:'1px solid #e3e3e3'}}>
                                    <h5>Edit/Update Presale Start Date</h5>
                                    <Input
                                    value={creatorForm.startDate}
                                    onChange={(event) => updateCreatorForm({ ...creatorForm, startDate: event.target.value }) }
                                    className='mb-5'
                                    ariaLabel="Presale Start Date"
                                    type={'date'}/>

                                    <h5>Edit/Update Presale End Date</h5>
                                    <Input
                                    value={creatorForm.endDate}
                                    onChange={(event) => updateCreatorForm({ ...creatorForm, endDate: event.target.value }) }
                                    className='mb-5'
                                    ariaLabel="Presale Start End"
                                    type={'date'}/>

                                    <Button
                                    onClick={updateCreatorPresale} 
                                    className='text-center' 
                                    size='lg' 
                                    isLight 
                                    rounded={0} 
                                    isOutline 
                                    color='primary' 
                                    style={{width:'100%'}}>Update</Button>
                                  </div>
                                </>) : null }
                              </CardBody>
                            </Card>
                          </>) : (<>

                            {/* contribute presale card */}
                            
                            { ['2', '3', '0'].includes(currentToken.status) ? <h6 className='text-capitalize'>Presale {currentToken.status === "0" ? 'Awaiting Start' : "Ended"}</h6> : (
                            <Card borderSize={1} borderColor={'primary'}>
                              <CardHeader>
                                <CardLabel className='text-muted'>
                                  <CardTitle>
                                    Your spent allowance
                                    <p style={{fontSize:20}}><Icon icon={'IncompleteCircle'} /> {myContributions.contributions} / {currentToken.maxContributions} BNB</p>
                                  </CardTitle>
                                </CardLabel>
                              </CardHeader>
                              <CardBody>
                                <div className='contianer text-center'>
                                  <h5>Spend How much BNB ?</h5>
                                  <div className='mt-3 p-3 mb-3' style={{borderRadius:10, border:'1px solid #e3e3e3'}}>
                                    <small>Balance: {balance}</small>
                                    <InputGroup>
                                      <Input 
                                      value={form.contribution}
                                      onChange={(event)=>{
                                        let amount = event.target.value;
                                        if(parseFloat(amount) <= parseFloat(currentToken.maxContributions)) {
                                          const allowance = currentToken.maxContributions - myContributions.contributions
                                          updateForm({ ...form, contribution: amount })
                                          if(allowance < 0 || amount > allowance) setButtonStatus(!buttonStatus)
                                        }
                                      }}
                                      ariaLabel='Contribute'
                                      type='number'
                                      placeholder='0.0'/>
                                      <InputGroupText>
                                        <span style={{marginRight:5}}>BNB</span>
                                        <Button onClick={()=>updateForm({ ...form, contribution: balance < currentToken.maxContributions ? parseFloat(balance) * 0.70 : currentToken.maxContributions })} color='success' isOutline isLight rounded={2}>MAX</Button>
                                      </InputGroupText>
                                    </InputGroup>

                                    <small className='text-danger'>{ form.contribution > balance ? 'Insufficient Balance' : null }</small>
                                    <small className='text-danger'>{ form.contribution > (currentToken.maxContributions - myContributions.contributions) ? 'Exceeded Limit' : null }</small>
                                  </div>
                                  <h5>You get</h5>
                                  <h4>{(presaleRate * parseFloat(form.contribution)).toFixed(2)} {currentToken.tokenname}</h4>
                                  <Button isDisable={buttonStatus} onClick={contributePresale} color='primary' isOutline isLight style={{width:'100%',marginTop:20}}>{ waitingAsync ? 'Loading...' : 'Purchase'}</Button>
                                </div>
                              </CardBody>
                            </Card>) }
                          </>)}
                          
                        </>)}
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className='col-md-12'>
            <Card className='rounded-0'>
              <CardBody>
                <div className='row'>
                  <div className='col-md-6 mb-5'>
                    <h3>Project Information</h3>
                    <table className='table table-modern table-hover'>
                      <tbody className='text-muted' style={{fontSize:15}}>
                        <tr>
                          <td>Project Name</td>
                          <td>{currentToken.tokenaddress}</td>
                        </tr>
                        <tr>
                          <td>Network</td>
                          <td>BSC</td>
                        </tr>
                        <tr>
                          <td>Website</td>
                          <td>{ currentToken.bscScanApi ? (<>
                            <a href={currentToken.bscScanApi.website} rel='noreferrer' target='_blank'>{currentToken.bscScanApi.website}</a>
                          </>) : 'null' }</td>
                        </tr>
                        <tr>
                          <td>Socials</td>
                          <td>{ currentToken.bscScanApi ? (<>
                            <div className='d-flex align-items-center justify-content-evenly'>
                              <a href={currentToken.bscScanApi.twitter} rel='noreferrer' target='_blank'><Icon size='2x' icon='Twitter' /></a>
                              <a href={currentToken.bscScanApi.github} rel='noreferrer' target='_blank'><Icon size='2x' icon='Globe' /></a>
                              <a href={currentToken.bscScanApi.telegram} rel='noreferrer' target='_blank'><Icon size='2x' icon='Telegram' /></a>
                            </div>
                          </>) : 'loading...' }</td>
                        </tr>
                        <tr>
                          <td>White Paper</td>
                          <td>{ currentToken.bscScanApi ? (<>
                            <a href={currentToken.bscScanApi.whitepaper} rel='noreferrer' target='_blank'>Open White paper</a>
                          </>) : 'loading...' }</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className='col-md-6'>
                    <h3>Token Information</h3>
                    <table className='table table-modern table-hover'>
                      <tbody className='text-muted' style={{fontSize:15}}>
                        <tr>
                          <td>Token Name</td>
                          <td>{currentToken.tokenname}</td>
                        </tr>
                        <tr>
                          <td>Symbol</td>
                          <td>{currentToken.symbol}</td>
                        </tr>
                        <tr>
                          <td>Contract Address</td>
                          <td>{ currentToken.bscScanApi ?  currentToken.bscScanApi.contractAddress : 'null'}</td>
                        </tr>
                        <tr>
                          <td>Total Supply</td>
                          <td>{ currentToken.bscScanApi ? `${new Intl.NumberFormat().format(currentToken.bscScanApi.totalSupply.substr(0, currentToken.bscScanApi.totalSupply.length - currentToken.bscScanApi.divisor))}` : 'loading...' }</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  )
}

export default SingleToken;