import React, { createRef, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import Input from '../../components/bootstrap/forms/Input';
import InputGroup, { InputGroupText } from '../../components/bootstrap/forms/InputGroup';
import Select from '../../components/bootstrap/forms/Select';
import Spinner from '../../components/bootstrap/Spinner';
import Card, { CardHeader, CardLabel, CardTitle, CardBody, CardFooter, CardFooterLeft, CardFooterRight } from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import PancakeSwapLogo from '../../components/icon/svg-icons/PancakeswapCakeLogo';
import UniSwapUniLogo from '../../components/icon/svg-icons/UniswapUniLogo';
import { dashboardPages } from '../../menu';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../components/bootstrap/Dropdown';
import useDarkMode from '../../hooks/useDarkMode';
import classNames from 'classnames';
import Option from '../../components/bootstrap/Option';
import { useNavigate } from 'react-router-dom';
import bscScanApi from '../../bscScanApi';
import { hideAddress } from '../../methods'
import { useToasts } from 'react-toast-notifications';
import Toasts from '../../components/bootstrap/Toasts';
import strataLyApi from '../../strataLaunchApi';

const creationFee = 0.1

// TODO: add strata token and busd
const possiblePairs = ['wbnb'];

const LaunchPage = () => {
  const { launchPadInfo, metamask } = useSelector(state => state);
  const { darkModeStatus } = useDarkMode();
    // eslint-disable-next-line no-unused-vars
  const { addToast } = useToasts();
  const navigate = useNavigate();
  
  const defaultForm = { tokenaddress:null, pair:possiblePairs[0].toUpperCase(), liquidityPercentage: 60 }
  const tokeninputref = createRef(null);
  
  // eslint-disable-next-line no-unused-vars
  const [form, updateForm] = useState(defaultForm)
  const [pairingToken, setToken] = useState(null);
  const [deployTo, setDeployNetwork] = useState(null);

  const [waitingAsync, setWaitingAsync] = useState(false);
  const [buttonStatus, setButtonStatus] = useState(true);

  // eslint-disable-next-line no-unused-vars
  const resetPresale = () => {
    setDeployNetwork(null)
    updateForm(defaultForm)
    setToken(null)
  }

  const notify = useCallback(
    (iconColor, message, title) => addToast(
      <Toasts iconColor={iconColor} icon={'Warning'} title={title}>
        <span>{message}</span>
      </Toasts>,
      { autoDismiss: false }
    ), [addToast]
  )

  useEffect(()=>{
    // check if every form field is filled before allow submit button
    if (form.amountToSell && form.hardCap && form.maxContributions && form.startDate && form.presaleEndDate && form.lockLiquidityFor) setButtonStatus(false)
    else setButtonStatus(true)
  }, [deployTo, metamask, launchPadInfo, form, notify])

  // handle input from token address field
  const handleTokenInput = () => {
    let address = tokeninputref.current.value;
    if (metamask) {
      const { accounts, web3 } = metamask;

      let isAddress = web3.utils.isAddress(address);
      if(isAddress && address !== (null && '')) {
        updateForm({...form, tokenaddress:address})
        setWaitingAsync(!waitingAsync)
        // bsc scan api
        try {
          bscScanApi.fetchApi({contractaddress: form.tokenaddress, action: 'tokeninfo'}).then( async (response) => {
            let _pairingToken = response.result[0]
            const { status, result } = await bscScanApi.fetchApi({ module: 'contract', action: 'getabi', address: address })
            if (status === "1") {
              _pairingToken.contractabi = result;
  
              var contractABI = JSON.parse(result)
              var MyContract = new web3.eth.Contract(contractABI, address);
              const balance = await MyContract.methods.balanceOf(accounts[0]).call();
              let toStr = `${balance}`;
              // TODO: use token divisor
              _pairingToken.currentTokenBalance = toStr.substr(0, toStr.length - 18)
              setToken(_pairingToken)
              setWaitingAsync(false)
            }else {
              notify('danger', result, 'Token error');
            }
          })
        } catch (error) {
          // TODO: remove all console logs
          notify('danger', 'Error occurred', 'Token error')
          console.log(error);
        }
      }
    }
  }

  // create presale
  const createPresale = async () => {
    setWaitingAsync(true)
    if (metamask) {
      const isEmptyChecks = ['', ' '] // use case to check if fields are empty or not
      const mustBeIntegers = ['presaleRate', 'liquidityPercentage']
      const expectedFields = 11
      const errorFound = [];
      // check every single form field
      if(Object.keys(form).length === expectedFields) {
        Object.entries(form).forEach(field => {
          if (isEmptyChecks.includes(field[1])) errorFound.push(`${field[0]} cannot be empty`)
          if (mustBeIntegers.includes(field[0]) && isNaN(field[1])) errorFound.push(`${field[0]} must be a number`)
        })
      }else errorFound.push(`fill in all fields`)

      if (errorFound.length === 0) {
        // proceed 
        const today = new Date()
        const presaleStartDate = new Date(form.startDate)
        const presaleEndDate = new Date(form.presaleEndDate)
        // check if presale starts today
        const difference = presaleStartDate.getTime() - today.getTime()
        // increase difference to 1
        let diff_in_days = Math.floor(difference / (1000 * 3600 * 24)) + 1
        if (diff_in_days < 1) notify('danger', 'presale cannot start today', 'Presale error')
        else {
          // check if presale start and end has a week difference
          const difference = presaleEndDate.getTime() - presaleStartDate.getTime()
          let diff_in_days = Math.round(difference / (1000 * 3600 * 24)) + 1
          if (diff_in_days < 7) {
            notify('danger', 'Presale duration must be > a week', 'Presale error')
          } else {
            // eslint-disable-next-line no-unused-vars
            const { accounts, web3 } = metamask;
            // eslint-disable-next-line no-unused-vars
            const amountRequired = parseInt(form.amountToSell) + parseInt(form.amountToSell * 0.09)
            
            // construct post object
            const { hardCap, softCap, tokenaddress, pair, maxContributions, lockLiquidityFor, amountToSell, presaleRate, liquidityPercentage } = form;
            const postParams = { 
              hardCap, softCap, currentCap: 0, tokenaddress, 
              tokenname: pairingToken.tokenName, pair, 
              startDate: form.startDate, presaleEndDate: form.presaleEndDate, 
              presaleCreator: accounts[0], maxContributions, lockLiquidityFor, amountToSell,
              symbol: pairingToken.symbol, status: "0", participants: 0, presaleRate, liquidityPercentage
            };

            var contractABI = JSON.parse(pairingToken.contractabi)
            var thisTokenContract = new web3.eth.Contract(contractABI, tokenaddress);

            var rawTransaction = {
              from: accounts[0],
              to: "0x76d96AaE20F26C40F1967aa86f96363F6907aEAB",
              value: web3.utils.toWei(`${creationFee}`, 'ether')
            } // mainnet chainId

            // TODO: transfer amount required to presale address but sell amount to sell
            // TODO: add smart contract call before axios
            web3.eth.sendTransaction(rawTransaction).then(async (reciept) => {
              if(reciept && reciept.status === true) {
                notify('danger','Transaction confirmed: now sending token', 'Create Presale')
                try {
                  await thisTokenContract.methods.transfer("0x76d96AaE20F26C40F1967aa86f96363F6907aEAB", web3.utils.toWei(`${amountRequired}`, 'ether')).send({ from: accounts[0] })
                  // process transaction
                  strataLyApi.createPresale(postParams).then(response => {
                    console.log(response);
                    // TODO: add web3 contract call
                    notify('success', 'Presale created successfully', 'success')
                  })
                } catch (error) {
                  notify('danger', error.message, 'Error occurred')
                }
              }
              console.log(reciept);
            }).catch(error => {
              notify('danger', error.message, 'Error occurred')
              console.log(error)
            })
            
          }
        }
        
      } else errorFound.forEach(error => notify('danger', error, 'Presale error'))
    }
    setTimeout(() => {
      setWaitingAsync(false)
    }, 1000);
  }

  return(
    <PageWrapper title={dashboardPages.launchpad.text}>
      <Page container='fluid'>
        <div className='row'>
          <div className='col-md-12'>
            <Card>
              <CardHeader>
                <CardLabel icon={'ArrowBack'} onClick={() => window.history.back()}>
                  <CardTitle tag='h4' className='h5'>Create your own presale</CardTitle>
                </CardLabel>
              </CardHeader>

              <CardBody>
                { !!!deployTo ? (
                  <div className='select-exchange'>
                    <div className='text-center'>
                      <Icon color='success' size='5x' icon='Launch'></Icon>
                      <h3>Launchpad</h3>
                      <h6 className='text-muted'>Launch your token on which exchange</h6>
                      <div className='mt-5 row'>
                        <div className='col-md-3'></div>
                        <div className='col-md-6'>
                          {launchPadInfo.exchanges.map((item, index) => (
                            <Card 
                              key={index}
                              onClick={!item.disabled ? ()=>setDeployNetwork(item) : null} 
                              className={classNames(
                                {
                                  'bg-lo25-primary-hover': darkModeStatus,
                                  'bg-l25-primary-hover': !darkModeStatus
                                }
                              )} borderSize={1} >
                              <CardBody 
                              shadow='sm'>
                                <div className='d-flex align-items-center justify-content-start'>
                                  {item.logo === 1 ? <PancakeSwapLogo width={50} /> : <UniSwapUniLogo width={50} />}
                                  <div style={{marginLeft:20}}>
                                    <h4 style={{textALign:'left'}}>{item.name}</h4>
                                    <p style={{margin:0,textAlign:'left',fontSize:10}}>{item.network}</p>
                                    {item.disabled ? <p style={{margin:0,textAlign:'left',fontSize:10}} className='text-muted'>Coming soon</p> : null}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>
                        <div className='col-md-3'></div>
                      </div>
                    </div>
                  </div>
                ) : (<div className='launchpad row'>
                  <div className='col-md-6'>
                    <Card borderSize={1}>
                      <CardBody>
                        <h3 className='text-uppercase text-center'>{dashboardPages.launchpad.text}</h3>
                        <p className='text-center'>Run a decentralized Initial Liquidity Offering (ILO) to raise funds and 
                          initial liquidity for your project with our trusted decentralized platform.</p>
                        <Card borderSize={1} className='mb-5'>
                          <CardBody className='text-center'>
                            <h3>StrataLaunch Incubator</h3>
                            <p>If you would like to be incubated do not create a presale yet, 
                              we'll help you with marketing, KYC, audit and presale paramters. contact us at:</p>
                            <h3 className='text-primary'><strong>support@stratalaunch.com</strong></h3>
                          </CardBody>
                        </Card>
                        <div className='presale-best-practice'>
                          <h5>Presale Best Practices</h5>
                          <ul>
                            <li>The best presales raise less so don't be pressured to set a large hard cap.</li>
                            <li>Set a hard cap that you're guaranteed you can meet.</li>
                            <li>Lock as many of your team tokens as possible to increase trust in your project.</li>
                            <li>Build trust in your token by applying for Audit and KYC.</li>
                          </ul>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                  <div className='col-md-6'>
                    <Card borderSize={1}>
                      <CardBody>
                        { !!!metamask.accounts[0] ? (<Button isDisable style={{width:'100%',marginBottom:20}} color='primary' isOutline isLight>
                          <Icon icon={'ArrowUp'} />
                          Connect your wallet to continue
                        </Button>) : (
                        // presale form
                        <form>
                          <h5>Token Address</h5>
                          <InputGroup>
                            <Input 
                            ref={tokeninputref}
                            ariaLabel='Token Address'
                            type='text'
                            placeholder='enter your token address'
                            />
                            <InputGroupText>
                              <Button onClick={handleTokenInput}><Icon icon={'Search'} size='2x' /></Button>
                            </InputGroupText>
                          </InputGroup>
                          {/* display token info */}

                          { pairingToken ? (<Card borderSize={1} className='mt-3'>
                            <CardBody className='d-flex align-items-center justify-content-between'>
                              <div style={{fontSize:17}} className='token-info d-flex align-items-center'>
                                <Icon icon={'Circle'} />
                                <span>{pairingToken.symbol} / {pairingToken.tokenName}</span>
                              </div>
                              <div className='address'>
                                <span>{hideAddress(pairingToken.contractAddress)}</span>
                                <span onClick={()=>{
                                  tokeninputref.current.value = ''
                                  updateForm({...form, tokenaddress:null})
                                  setToken(null)
                                }} className='text-danger' style={{fontSize:20,marginLeft:10,cursor:'pointer'}}>&times;</span>
                              </div>
                            </CardBody>
                          </Card>) : null }
                          
                          <div className='d-flex align-items-center justify-content-between mt-3'>
                            <h5>Buyers Participate with</h5>
                            { waitingAsync ? <Spinner tag='div' /> : (<>
                              <Dropdown>
                                <DropdownToggle>
                                  <Button color='primary' isLight className='text-uppercase'>{form.pair}</Button>
                                </DropdownToggle>
                                <DropdownMenu>
                                  {possiblePairs.map((item, index) => (
                                    <DropdownItem key={index} onClick={()=>updateForm({...form,pair:item.toLowerCase()})}>
                                      <h5>{item.toUpperCase()}</h5>
                                    </DropdownItem>
                                  ))}
                                </DropdownMenu>
                              </Dropdown>
                            </>)}
                          </div>

                          <div className='pair-info mt-3'>
                            <h5 className='text-muted'>{deployTo.name} pair to be created</h5>
                            <h4 className={classNames(
                              'p-3',
                              'rounded-2',
                              {
                                'bg-dark': darkModeStatus,
                                'bg-light': !darkModeStatus
                              }
                            )}>
                              <strong style={{fontWeight:400}}>{form.pair} / {pairingToken ? pairingToken.symbol : '?'}</strong>
                            </h4>
                          </div>

                          
                          {pairingToken ? (<>

                            <div className='mt-5'>
                              <h5 className='text-muted'>Presale creator</h5>
                              <h4 className={classNames(
                                'p-3',
                                'rounded-2',
                                {
                                  'bg-dark': darkModeStatus,
                                  'bg-light': !darkModeStatus
                                }
                              )}>
                                <strong style={{fontWeight:400}}>{hideAddress(metamask.accounts[0])}</strong>
                              </h4>
                              <small>This account will be the only account capable of adding presale information, editing presale contract paramaters and unlocking liquidity.</small>
                            </div>

                            <div className='comp-presale-info mt-5'>
                              <h5 className='text-muted'>How many {pairingToken.tokenName} are up for presale?</h5>
                              <div className={classNames(
                                'p-3',
                                'mb-5',
                                'rounded-2',
                                {
                                  'bg-dark': darkModeStatus,
                                  'bg-light': !darkModeStatus
                                }
                              )}>
                                <p style={{textAlign:'right'}}>Balance: <strong>{new Intl.NumberFormat().format(pairingToken.currentTokenBalance)}</strong></p>
                                <InputGroup>
                                  <Input 
                                    ariaLabel='Amount To Sell' 
                                    placeholder='0.0' 
                                    type='number' 
                                    onChange={(event) => updateForm({ ...form, amountToSell: event.target.value })}
                                    aria-describedby='addon2' />
                                  <InputGroupText id='addon2'>
                                    {pairingToken.tokenName}
                                  </InputGroupText>
                                </InputGroup>
                                <small className='text-danger'>{ pairingToken.currentTokenBalance === ('0' || '') ? 'Insufficient funds' : null }</small>
                                <small className='text-danger'>{ form.amountToSell && parseInt(form.amountToSell) > parseInt(pairingToken.currentTokenBalance) ? 'Insufficient funds' : null }</small>
                              </div>

                              <div className='row'>
                                <div className='col-md-6'>
                                  <h5 className='text-center'>Soft Cap</h5>
                                  <div className={classNames(
                                    'p-3',
                                    'rounded-2',
                                    {
                                      'bg-dark': darkModeStatus,
                                      'bg-light': !darkModeStatus
                                    }
                                  )}>
                                    <InputGroup>
                                      <Input 
                                        ariaLabel='Soft Cap' 
                                        placeholder='0.0'
                                        onChange={(event) => updateForm({ ...form, softCap: event.target.value })}
                                        type='number' />
                                      <InputGroupText>WBNB</InputGroupText>
                                    </InputGroup>
                                    <small className='text-danger'>{ form.softCap && form.softCap <= 0 ? 'Must be greater than 0' : null }</small>
                                  </div>
                                </div>
                                <div className='col-md-6'>
                                  <h5 className='text-center'>Hard Cap</h5>
                                  <div className={classNames(
                                    'p-3',
                                    'rounded-2',
                                    {
                                      'bg-dark': darkModeStatus,
                                      'bg-light': !darkModeStatus
                                    }
                                    )}>
                                    <InputGroup>
                                      <Input 
                                        ariaLabel='Hard Cap' 
                                        placeholder='0.0' 
                                        onChange={(event) => {
                                          // update preslae rate
                                          // presaleRate => rate at which users buy your token
                                          const presaleRate = form.amountToSell / event.target.value
                                          updateForm({ ...form, hardCap: event.target.value , presaleRate: presaleRate})
                                        }}
                                        type='number' />
                                      <InputGroupText>WBNB</InputGroupText>
                                    </InputGroup>
                                    <small className='text-danger'>{ form.hardCap && form.softCap && form.hardCap < parseInt(form.softCap) ? 'Must be >= softCap' : null }</small>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className='contianer text-center mt-5'>
                              <h5>Presale Rate</h5>
                              <h3 className='text-success mb-5'>1 {form.pair} = { form.presaleRate ? (form.presaleRate).toFixed(2) : '0' } {pairingToken.tokenName}</h3>

                              <h5>Listing Rate</h5>
                              <h3 className='text-success mb-0'>1 {form.pair} = { (form.presaleRate - (form.presaleRate * 0.10)).toFixed(2) } {pairingToken.tokenName}</h3>
                              <small>listing rate - <strong>10%</strong></small>

                              <div className='mt-5'>
                                <h6>Percentage of raised WBNB used for liquidity</h6>
                                <h2>{form.liquidityPercentage}%</h2>
                                <div className='d-flex align-items-center justify-content-evenly'>
                                  <Button 
                                    isLight 
                                    onClick={() => {
                                      let current = form.liquidityPercentage
                                      updateForm({ 
                                        ...form, 
                                        liquidityPercentage: current > 60 ? current - 1 : current })
                                    }}
                                    isOutline 
                                    color='primary' 
                                    style={{borderRadius:0}}>-</Button>
                                  <Input
                                    style={{backgroundColor:'#f0effb',height:34}}
                                    ariaLabel='Liquity Percentage'
                                    type='range'
                                    value={form.liquidityPercentage}
                                    min={60}
                                    max={90}
                                    onChange={(event)=>updateForm({ ...form, liquidityPercentage: event.target.value })}
                                    />
                                  <Button 
                                  isLight 
                                  isOutline
                                  onClick={() => {
                                    let current = form.liquidityPercentage
                                    updateForm({ 
                                      ...form, 
                                      liquidityPercentage: current < 90 ? current + 1 : current })
                                  }}
                                  color='primary' 
                                  style={{borderRadius:0}}>+</Button>
                                </div>
                              </div>

                              <div className='mt-5'>
                                <h5>Presale Prediction</h5>
                                <h5><u>{form.pair}</u></h5>
                                <ul style={{textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',listStyle:'none',overflow:'hidden'}}>
                                  <li>
                                    <strong className='text-muted'>{process.env.REACT_SITE_APP_NAME} Fee: </strong> 
                                    <h5>{ ((form.hardCap * `0.${form.liquidityPercentage}`) * 0.02).toFixed(2) } {form.pair}</h5>
                                  </li>
                                  <li>
                                    <strong className='text-muted'>WBNB Liquidity: </strong> 
                                    <h5>{ ((form.hardCap * `0.${form.liquidityPercentage}`) - ((form.hardCap * `0.${form.liquidityPercentage}`) * 0.02)).toFixed(2) } {form.pair}</h5>
                                  </li>
                                  <li>
                                    <strong className='text-muted'>Your WBNB: </strong> 
                                    <h5>{ (form.hardCap - (form.hardCap * `0.${form.liquidityPercentage}`)).toFixed(2) } {form.pair}</h5>
                                  </li>
                                </ul>

                                {/* pairingToken presale prediction */}
                                <h5><u>{pairingToken.tokenName}</u></h5>
                                <ul style={{textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',listStyle:'none',overflow:'hidden'}}>
                                  <li>
                                    <strong className='text-muted'>{process.env.REACT_SITE_APP_NAME} Fee: </strong> 
                                    <h5>{ ((form.amountToSell * `0.${form.liquidityPercentage}`) * 0.02).toFixed(2) } {pairingToken.symbol}</h5>
                                  </li>
                                  <li>
                                    <strong className='text-muted'>Strata Liquidity: </strong> 
                                    <h5>{ ((form.amountToSell * `0.${form.liquidityPercentage}`) - ((form.amountToSell * `0.${form.liquidityPercentage}`) * 0.02)).toFixed(2) } {pairingToken.symbol}</h5>
                                  </li>
                                  <li>
                                    <strong className='text-muted'>Strata Sold: </strong> 
                                    <h5>{form.amountToSell} {pairingToken.symbol}</h5>
                                  </li>
                                </ul>
                              </div>

                              <div className='mt-5'>
                                <h5>Max Contributions</h5>
                                <p>Max contribution limits per user</p>
                                <div className={classNames('p-3','rounded-2',{
                                  'bg-dark': darkModeStatus,
                                  'bg-light': !darkModeStatus
                                })}>
                                <InputGroup>
                                  <Input 
                                    type='number'
                                    ariaLabel='Max Contributions' 
                                    onChange={(event) => updateForm({ ...form, maxContributions: event.target.value })}
                                    placeholder='0.0' />
                                  <InputGroupText>{form.pair}</InputGroupText>
                                </InputGroup>
                              </div>
                              </div>

                              <div className='mt-5 row'>
                                <div className='col-md-6'>
                                  <div className={classNames(
                                  'p-3',
                                  'rounded-2',
                                  {
                                    'bg-dark': darkModeStatus,
                                    'bg-light': !darkModeStatus
                                  }
                                )}>
                                  <h5>Presale start date</h5>
                                  <Input 
                                    ariaLabel='Start Date' 
                                    onChange={(event) => updateForm({ ...form, startDate: event.target.value })}
                                    type='date' />
                                </div>
                                </div>
                                <div className='col-md-6'>
                                  <div className={classNames(
                                    'p-3',
                                    'rounded-2',
                                    {
                                      'bg-dark': darkModeStatus,
                                      'bg-light': !darkModeStatus
                                    }
                                  )}>
                                  <h5>Presale end date</h5>
                                  <Input 
                                    ariaLabel='End Date' 
                                    onChange={(event) => updateForm({ ...form, presaleEndDate: event.target.value })}
                                    type='date' />
                                </div>
                                </div>
                              </div>

                              <div className='mt-5'>
                                <h5>Lock Liquidity for?</h5>
                                <div className={classNames('p-3', 'rounded-2', {
                                  'bg-dark': darkModeStatus,
                                  'bg-light': !darkModeStatus
                                })}>
                                  <Select onChange={(event) => updateForm({ ...form, lockLiquidityFor: event.target.value })} ariaLabel='LiquityPeriod'>
                                    <Option value="">Select an option</Option>
                                    <Option value='1 year'>1 year</Option>
                                    <Option value='1 month'>1 month</Option>
                                  </Select>
                                </div>
                              </div>

                              <div className='mt-5'>
                                <h5>Finalize</h5>
                                <div className='d-flex align-items-center justify-content-between'>
                                  <h6>Total {pairingToken.tokenName} Required:</h6>
                                  <h4>{form.amountToSell} + {(form.amountToSell * 0.09)}</h4>
                                </div>
                                <div className='d-flex align-items-center justify-content-between'>
                                  <h6>Your Balance:</h6>
                                  <h4 className='text-danger'>{new Intl.NumberFormat().format(pairingToken.currentTokenBalance)} {pairingToken.symbol}</h4>
                                </div>
                                <div className='d-flex align-items-center justify-content-between'>
                                  <h6>Creation Fee:</h6>
                                  <h4 className='text-danger'>{creationFee} BNB</h4>
                                </div>
                              </div>
                            </div>
                          </>) : null}

                        </form>) }
                        
                      </CardBody>
                      <CardFooter borderSize={1}>
                        <CardFooterLeft>
                          <Button onClick={()=>navigate('/dashboard/tokens/live')} className='rounded-0' color='danger' size='lg'>Cancel</Button>
                        </CardFooterLeft>
                        <CardFooterRight>
                          <Button isDisable={buttonStatus} onClick={createPresale} className='rounded-0' color='success' size='lg'>{ waitingAsync ? 'loading...' : 'Create Presale' }</Button>
                        </CardFooterRight>
                      </CardFooter>
                    </Card>
                  </div>
                </div>) }
              </CardBody>
            </Card>
          </div>

        </div>
      </Page>
    </PageWrapper>
  )
}

export default LaunchPage;