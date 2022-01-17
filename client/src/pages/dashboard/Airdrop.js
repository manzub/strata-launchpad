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
import bscScanApi from "../../bscScanApi";
import { useToasts } from 'react-toast-notifications';
import Toasts from '../../components/bootstrap/Toasts';
// contract
import MyContract from '../../contracts/Airdrop.json';

const Airdrop = () => {
  const { metamask } = useSelector(state => state);
  const { addToast } = useToasts();

  const [form, updateForm] = useState({ airdroptype: 1, tokenaddress: '', tokensperuser: 0, _distrib: '', balance: 0 })
  const [droppingToken, setToken] = useState(null)

  const [isApproved, setApprovedState] = useState(false)
  const [waitingAsync, setWaitingAsync] = useState(false)

  const notify = useCallback(
    (iconColor, message, title) => addToast(
      <Toasts iconColor={iconColor} icon={'Warning'} title={title}>
        <span>{message}</span>
      </Toasts>,
      { autoDismiss: false }
    ), [addToast]
  )

  const handleTokenInput = () => {
    setToken(null)
    setWaitingAsync(true)
    if (metamask.web3) {
      const { accounts, web3 } = metamask
      let isAddress = web3.utils.isAddress(form.tokenaddress)

      if(isAddress && form.tokenaddress !== (null && '')) {
        bscScanApi.fetchApi({ module: 'token', action: 'tokeninfo', contractaddress: form.tokenaddress }).then( async (response) => {
          if(response.status === "1") {
            const _token = response.result[0];
            const responseData = await bscScanApi.fetchApi({ module: 'contract', action: 'getabi', address: form.tokenaddress })
            if(responseData.status === "0") {
              notify('danger', responseData.result, 'Token Error')
            }else {
              // abi functions
              _token.contractabi = responseData.result
              var contractABI = JSON.parse(responseData.result)
              var MyContract = new web3.eth.Contract(contractABI, form.tokenaddress);
              const balance = await MyContract.methods.balanceOf(accounts[0]).call();
              let toStr = `${balance}`;
              // TODO: use divisor instead
              updateForm({ ...form, balance: toStr.substr(0, toStr.length - 18) })
              setToken(_token)
            }
          }
        })
      } else notify('danger', 'Invalid address', 'Token Error')
    }
    setWaitingAsync(false)
  }

  const approveAirdrop = async () => {
    // approve airdrop
    // 0xAa98D6AA2E53cFc56468919519277B9FC21Fdf65
    setWaitingAsync(true)
    const isEmptyChecks = ['', ' '] // use case to check if fields are empty or not
    const expectedFields = 5
    const errorFound = [];
    // check every single form field
    if(Object.keys(form).length === expectedFields) {
      let isValid = true

      Object.entries(form).forEach(field => {
        if (isEmptyChecks.includes(field[1])) {
          isValid = false
          notify('danger', `${field[0]} cannot be empty`, 'Airdrop error')
        }
      })

      if(isValid) {
        // proceed
        if(metamask.web3) {
          const { accounts, web3 } = metamask

          const distributionList = [];
          let errorFound = 0;
          let _distrib = form._distrib.split(",");
          _distrib.length > 1 && _distrib.forEach((address, idx) => {
            let x = address.trim();
            if(x !== (null && '')) {
              let isAddress = web3.utils.isAddress(x);
              if(isAddress) {
                distributionList.push(x)
              } else {
                errorFound += 1;
                notify('danger', `Invalid address #${idx+1}`, 'Airdrop error')
              }
            }
          })

          if(errorFound === 0 ) {
            if(distributionList.length > 1) {
              // proceed
            const amountToApprove = distributionList.length * form.tokensperuser

            var contractABI = JSON.parse(droppingToken.contractabi)
            var thisTokenContract = new web3.eth.Contract(contractABI, form.tokenaddress);

            var airdropABI = MyContract.abi
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = MyContract.networks[networkId]
            var AirdropContract = new web3.eth.Contract(airdropABI, deployedNetwork && deployedNetwork.address)

            try {
              const approved = await thisTokenContract.methods.approve('0x414f65979B81b4A46742117Fb6Fe28f8455Bca3a', amountToApprove + form.tokensperuser).send({ from: accounts[0] })
              console.log(approved);
              if(approved) {
                // transfer tokens
              }
            } catch (error) {
              notify('danger', 'Error occurred while approving token, try again: '+error.message, 'Airdrop error')
              console.log(error);
            }

            } else notify('danger', 'all distribution list addresses are invalid', 'Airdrop error') 
          } 
        }
      }
    }else notify('danger', `fill in all fields`, 'Airdrop error')

    if(errorFound.length === 0) {
      
    }
    setTimeout(() => {
      setWaitingAsync(false)
    }, 1000);
  }

  const proceedAirdrop = () => {
    // proceed with airdrop
  }

  return (
    <PageWrapper title='Airdrop Instantly'>
      <Page container='fluid'>
        <div className='row mt-5'>
          <div className='col-md-8 offset-2'>
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

                    {/* TODO: add fees */}
                    <h5 className='text-center'>Airdrop Fees: 0.1 BNB</h5>
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
                    </>) : null }
                  </div>
                </>) : <>
                  <Button style={{width:'100%'}} isLight isDisable rounded={0} color='warning' ><Icon icon='ArrowUpward' /> Connect Wallet to continue</Button>
                </> }
                <div className='mt-5 text-center'>
                  { droppingToken ? (<>
                    <Button onClick={approveAirdrop} style={{marginRight:10}} rounded={0} color='primary'>Approve</Button>
                    <Button onClick={proceedAirdrop} isDisable={!isApproved} rounded={0} color='primary'>Airdrop</Button>
                  </>) : null }
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Page>
    </PageWrapper>
  )
}

export default Airdrop;