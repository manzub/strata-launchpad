import React, { forwardRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Button from '../../components/bootstrap/Button';
import Card, { CardBody } from '../../components/bootstrap/Card';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../components/bootstrap/Dropdown';
import Icon from '../../components/icon/Icon';
import { getTierInfo } from '../../static/tiersInfo';
import { baseTokenAbi } from '../../utils/methods';

// TODO: add tiers
const Teirs = forwardRef(() => {
  const { metamask } = useSelector(state => state);
  const [tiers, setTiers] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if(metamask.web3) {
      !tiers && baseTokenAbi('arata').then(async response => {
        if(response.status !== '1') throw new Error(response.message)
        // get balance
        let contractabi = response.contractAbi;
        let contract = new metamask.web3.eth.Contract(contractabi, response.tokenaddress)
        const baseTokenBalance = await contract.methods.balanceOf(metamask.accounts[0]).call()
        let balanceToEth = metamask.web3.utils.fromWei(baseTokenBalance, 'ether')
        // get tier info
        let tierInfo = getTierInfo(balanceToEth);
        setTiers({ ...tierInfo, allowance: balanceToEth})
      }).catch(error => console.log(error))
    }
  }, [metamask, tiers])

  if (location.pathname !== "/") {
    return(<>
      <div style={{padding: '0px 10px'}}>
        { tiers ? (<>
          <Card shadow='sm' className='rounded-0'>
            <CardBody>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='left-side'>
                  <div className='d-flex align-items-center'>
                    <Icon style={{color:'#C9D1FD'}} className='mr-1' icon='MonetizationOn' size='6x' />
                    <div className='info d-block'>
                      <small>Tier</small>
                      <h3 style={{margin:0}} className='text-uppercase'><strong>{tiers.name}</strong></h3>
                      <h6 style={{margin:0}}>Allowance: {tiers.allowance} $ARATA</h6>
                    </div>
                  </div>
                </div>
                <div className='right-side action'>
                  <Dropdown>
                    <DropdownToggle hasIcon={false}>
                      <Button isLight color='primary' rounded={0}><Icon icon='KeyboardArrowDown' /></Button>
                    </DropdownToggle>
                    <DropdownMenu rounded={0}>
                      <DropdownItem> Upgrade </DropdownItem>
                      <DropdownItem> Top up allowance </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </CardBody>
          </Card>
        </>) : null }
      </div>
    </>)
  } 
  return null
})

export default Teirs;