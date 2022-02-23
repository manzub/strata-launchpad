import React, { useCallback, useState } from 'react';
import Button from '../../components/bootstrap/Button';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Input from '../../components/bootstrap/forms/Input';
import Textarea from '../../components/bootstrap/forms/Textarea';
import InputGroup, { InputGroupText } from '../../components/bootstrap/forms/InputGroup';
import Select from '../../components/bootstrap/forms/Select';
import Option from '../../components/bootstrap/Option';
import Icon from '../../components/icon/Icon';
import Page from '../../layout/Page/Page';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import { useSelector } from 'react-redux';
import bscScanApi from "../../utils/bscScanApi";
import { useToasts } from 'react-toast-notifications';
import Toasts from '../../components/bootstrap/Toasts';
import strataLyApi, { devaddress } from '../../utils/strataLaunchApi';

// TODO: revert for test
const creationFee = 0.01;

const Airdrop = () => {
  const { metamask } = useSelector(state => state);
  const { addToast } = useToasts();

  const [form, updateForm] = useState({ airdroptype: 1, tokenaddress: '', tokensperuser: 0, _distrib: '', balance: 0 })
  const [droppingToken, setToken] = useState(null)

  const [isApproved, setApprovedState] = useState(null)
  const [waitingAsync, setWaitingAsync] = useState(false)

  const notify = useCallback(
    (iconColor, message, title) => addToast(
      <Toasts iconColor={iconColor} icon={'Warning'} title={title}>
        <span>{message}</span>
      </Toasts>,
      { autoDismiss: false }
    ), [addToast]
  )

  const clearAsync = () => setWaitingAsync(false)

  const handleTokenInput = () => {
    setToken(null)
    setWaitingAsync(true)
    if (metamask.web3) {
      const { accounts, web3 } = metamask
      let isAddress = web3.utils.isAddress(form.tokenaddress)

      if(isAddress && form.tokenaddress !== (null && '')) {
        try {
          bscScanApi.fetchApi({ module: 'token', action: 'tokeninfo', contractaddress: form.tokenaddress }).then( async (response) => {
            if(response.status === "1") {
              const _token = response.result[0];
              const responseData = await bscScanApi.fetchApi({ module: 'contract', action: 'getabi', address: form.tokenaddress })
              if(responseData.status === "1") {
                // abi functions
                _token.contractabi = responseData.result
                var contractABI = JSON.parse(responseData.result)
                var MyContract = new web3.eth.Contract(contractABI, form.tokenaddress);
                const balance = await MyContract.methods.balanceOf(accounts[0]).call();
                let toStr = `${balance}`;
                // TODO: use divisor instead
                updateForm({ ...form, balance: toStr.substr(0, toStr.length - 18) })
                setToken(_token)
              } else throw new Error(responseData.result)
            }
          })
        } catch (error) {
          notify('danger', 'error occurred', 'Token Error')
        } 
      } else notify('danger', 'Invalid address', 'Token Error')
    }
    setWaitingAsync(false)
  }

  const approveAirdrop = async () => {
    // approve airdrop
    setWaitingAsync(true);
    const isEmptyChecks = ['', ' '] // use case to check if fields are empty or not
    const expectedFields = 5
    // check every single form field
    if(Object.keys(form).length === expectedFields) {
      let isValid = true
      Object.entries(form).forEach(field => {
        if (isEmptyChecks.includes(field[1])) {
          isValid = false
          notify('danger', `${field[0]} cannot be empty`, 'Airdrop error')
        }
      })

      if(isValid && metamask.web3) {
        const { accounts, web3 } = metamask

        const distributionList = [];
        let errorFound = 0;
        let _distrib = form._distrib.split(",");
        _distrib.length > 1 && _distrib.forEach((address, idx) => {
          let x = address.trim();
          if(x !== (null && '')) {
            if(web3.utils.isAddress(x)) {
              distributionList.push(x)
            } else {
              errorFound += 1;
              notify('danger', `Invalid address #${idx+1}`, 'Airdrop error')
            }
          }
        })

        if(errorFound === 0 ) {
          if(distributionList.length > 1) {
            // pay creation fee
            web3.eth.sendTransaction({ from: accounts[0], to: devaddress, value: web3.utils.toWei(`${creationFee}`, 'ether') }).then(async (reciept) => {
              if (reciept && reciept.status === true) {
                notify('warning','Confirmed creation fee, proceeding with airdrop', 'Create Presale')
                // abi contract for the token to airdrop
                var thisTokenContract = new web3.eth.Contract(JSON.parse(droppingToken.contractabi), form.tokenaddress);
                const _contractaddress = '0x9DB269bf4ac28a029A2B3f0E814F53C9D75a67E2';
                try {
                  // set airdrop token
                  const response = await strataLyApi.setTokenAddress({ tokenaddress: form.tokenaddress })
                  if(response.status === 1) {
                    const amountToApprove = distributionList.length * form.tokensperuser
                    const value = parseInt(amountToApprove) + parseInt(form.tokensperuser)
                    const approved = await thisTokenContract.methods.approve(_contractaddress, web3.utils.toWei(`${value}`, 'ether')).send({ from: accounts[0] })
                    if(approved) {
                      notify('success', response.message + ', transfer tokens to begin airdrop', 'Airdop Info')
                      // transfer tokens
                      await thisTokenContract.methods.transfer(_contractaddress, web3.utils.toWei(`${value}`, 'ether')).send({ from: accounts[0] })
                      notify('success', 'Proceed to begin airdrop', 'Airdop Info')
                      setApprovedState(distributionList);
                      clearAsync();
                    }
                  } else {
                    notify('danger', response.message, 'Airdrop error')
                    clearAsync()
                  }
                  
                } catch (error) {
                  notify('danger', 'Error occurred while approving token, try again: '+error.message, 'Airdrop error')
                  clearAsync()
                }
              } else clearAsync()
            }).catch(error => {
              notify('danger', 'Error occurred while approving token, try again: '+error.message, 'Airdrop error')
              clearAsync()
            })
          } else {
            notify('danger', 'all distribution list addresses are invalid', 'Airdrop error') 
            clearAsync()
          }
        } else clearAsync()
      } else clearAsync()
    }else {
      notify('danger', `fill in all fields`, 'Airdrop error')
      clearAsync()
    }
  }

  const sliceToChunks = (arr, size) => {
    const res = [];
    for (let i = 0; i < arr.length; i += size) {
        const chunk = arr.slice(i, i + size);
        res.push(chunk);
    }
    return res;
  }

  const proceedAirdrop = async () => {
    setWaitingAsync(true)
    // proceed with airdrop
    if(metamask) {
      if(form.creatoremail) {
        var distributionList = [];
        if(isApproved.length > 200) {
          distributionList = sliceToChunks(isApproved, 200);
        } else distributionList.push(isApproved)

        try {
          const response = await strataLyApi.dropTokens({ distributionList, tokensperuser: form.tokensperuser, creatorEmail: form.creatoremail })
          if(response.status === 1) {
            notify('success', response.message, 'Airdrop Completed!')
            clearAsync();
          } else {
            throw new Error(response.message)
          }
        } catch (error) {
          notify('danger', error.message, 'Airdrop error')
          clearAsync()
        }
      } else {
        notify('danger', 'enter your email', 'Airdrop Error')
        clearAsync()
      }
    } else clearAsync()
  }

  return (
    <PageWrapper title='Airdrop Instantly'>
      <Page container='fluid'>
        <div className='row mt-5'>
          <div className='col-md-8 offset-md-2'>
            <Card>
              <CardHeader>
                <CardTitle tag='h4'>Airdrop your token to all your users instantly with the click of a button!</CardTitle>
              </CardHeader>
              <CardBody>
                { !!metamask.accounts[0] ? (<>
                  <div className='p-4' style={{border:'1px solid #e3e3e3',borderRadius:5}}>
                    <Select onChange={(event) => updateForm({ ...form, airdroptype: event.target.value })} ariaLabel='Airdrop Type'>
                      <Option value={1}>Airdrop Tokens</Option>
                      <Option disabled value={2}>Airdrop BNB</Option>
                    </Select>

                    <div className='mt-5 instructions'>
                      <h5>Airdrop Instructions</h5>
                      <ul className='text-muted'>
                        <li className='text-danger'>Ensure your token is verified</li>
                        <li>Airdrop tokens to as many users as desired</li>
                        <li>If you are running a sale make sure tokens are not airdropped until after!</li>
                        <li>Enter your token address first</li>
                        <li>Enter a list of users to airdrop followed by amount (comma separated)</li>
                      </ul>
                    </div>

                    <h5 className='text-center'>Airdrop Fees: {creationFee} BNB</h5>
                    <InputGroup>
                      <Input 
                      type='text'
                      disabled={waitingAsync}
                      ariaLabel='tokenaddress' 
                      onChange={(event) => updateForm({ ...form, tokenaddress: event.target.value })}
                      placeholder='Eg. 0x5bE6eC9a5d1EF8390d22342EDA90E2Fc6F1A9f7d' />
                      <InputGroupText>
                        <Button isDisable={waitingAsync} onClick={handleTokenInput}>
                          { waitingAsync ? <Icon icon='MoreHoriz' /> : <Icon icon={'Search'} /> }
                        </Button>
                      </InputGroupText>
                    </InputGroup>
                    
                    { droppingToken ? (<>
                      <h6>Token Name: <strong className='text-secondary'>{ droppingToken.tokenName }</strong> </h6>
                      <h6>Your Balance: <strong className='text-secondary'>{new Intl.NumberFormat().format(form.balance)}</strong> </h6>

                      <Textarea 
                      onChange={(event) => updateForm({ ...form, _distrib: event.target.value })} 
                      className='mt-5' 
                      ariaLabel='Airdrop Addresses' 
                      placeholder='Enter Distribution List, seperate addresses by (,)' />
                      <small className='text-danger'>For best results we recommend you do a maximum of 200 Addresses at a time!</small>
                      <br />
                      <small className='text-danger'>Always remove trailing whitespaces</small>

                      <div className='mt-5'>
                        <h5 className='text-center'>Tokens per user</h5>
                        <InputGroup>
                          <Input 
                          type='number' 
                          onChange={(event) => updateForm({ ...form, tokensperuser: event.target.value })}
                          placeholder='0.0'
                          ariaLabel='token' />
                          <InputGroupText>{ droppingToken.tokenName }</InputGroupText>
                        </InputGroup>
                        <small className='text-center'>Total tokens being airdropped: <strong className='text-secondary'>{ form.tokensperuser !== '' ? parseInt(form.tokensperuser) * form._distrib.split(",").length : 0 }</strong></small>
                      </div>

                      { isApproved ? (<>
                        <h5>Enter your email address to recieve an alert when the airdrop is done.</h5>
                        <Input 
                        ariaLabel='email'
                        type='email'
                        placeholder='your email address'
                        onChange={(event) => updateForm({ ...form, creatoremail: event.target.value })}
                        />
                      </>) : null }
                    </>) : null }
                  </div>
                  <div className='mt-5 text-center'>
                    { droppingToken ? (<>
                      <Button onClick={approveAirdrop} isDisable={waitingAsync || !!isApproved} style={{marginRight:10}} rounded={0} color='primary'>{ waitingAsync ? 'loading...' : 'Approve' }</Button>
                      <Button onClick={proceedAirdrop} isDisable={(waitingAsync || !isApproved)} rounded={0} color='primary'>{ !!isApproved && waitingAsync ? 'loading...' : 'Airdrop' }</Button>
                    </>) : null }
                  </div>
                </>) : <>
                  <Button style={{width:'100%'}} isLight isDisable rounded={0} color='warning' ><Icon icon='ArrowUpward' /> Connect Wallet to continue</Button>
                </> }
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  )
}

export default Airdrop;