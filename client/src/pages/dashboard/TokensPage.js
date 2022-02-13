import React, { useState } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import { combineMenu } from '../../static/menu';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../components/bootstrap/Dropdown';
import Progress from '../../components/bootstrap/Progress';
import Icon from '../../components/icon/Icon';
import { useClipboard } from 'use-clipboard-copy';
import showNotification from '../../components/extras/showNotification';
import { useSelector } from 'react-redux';
import Alert from '../../components/bootstrap/Alert';

// eslint-disable-next-line no-unused-vars

const TableRow = ({ index, image, tokenname, currentCap, hardCap, color, tokenaddress, participants, status, startDate, presaleEndDate }) => {
  const clipboard = useClipboard();
  const navigate = useNavigate();

  const ImageOrIcon = () => {
    if(image) {
      return (<img src={image} alt='coin cover' />)
    }
    return (<Icon size='4x' icon={'Circle'} />)
  }
  const _startDate = new Date(startDate);
  const _endDate = new Date(presaleEndDate);
  const today = new Date();

  let statusText = '';
  if (['2','3'].includes(status)) {
    statusText = 'Completed'
  }else if(status === '0') {
    const difference = _startDate.getTime() - today.getTime() 
    let diff_in_days = Math.round(difference / (1000 * 3600 * 24))
    if (diff_in_days === 0) statusText = 'Starts Tomorrow'
    else statusText = `Starts In ${diff_in_days} day(s)`;
  }else if (status === '1') {
    const difference =  _endDate.getTime() - today.getTime()
    let diff_in_days = Math.round(difference / (1000 * 3600 * 24))
    statusText = `${diff_in_days + 1} day(s) left`
  }

  return(<tr>
    <td>{index}</td>
    <td><ImageOrIcon /></td>
    <td><h3>{tokenname} <Icon style={{cursor:"pointer"}} onClick={() => {
      clipboard.copy(tokenaddress);
      showNotification(
        'Copied to Clipboard',
        <div className='row d-flex align-items-center'>
          <div className='col-auto'>
            <Icon icon={'CardHeading'} className='h1' />
          </div>
          <div className='col-auto h5'>{tokenaddress}</div>
        </div>,
      );
    }} icon={'ContentCopy'} /> </h3></td>
    <td>
      { `${parseFloat(currentCap).toFixed(2)}/${hardCap}` } BNB
      <Progress color={color} min={0} max={hardCap} value={currentCap} isAnimated={true} height={30} />
    </td>
    <td>{participants} Participants</td>
    <td>{ statusText }</td>
    <td><Button className='rounded-0' color='primary' onClick={() => navigate(`/dashboard/token/${tokenaddress}`)} isOutline isLight>View</Button></td>
  </tr>)
}

// eslint-disable-next-line no-unused-vars
const filtersCode = ['1', '2', '0', '3', "all"]
const filtersText = ['live', 'completed', 'awaiting start', 'failed', "all"]
const Dashboard = () => {
  const navigate = useNavigate();
  let { filter } = useParams();

  const tokensAndPairs = useSelector(state => state.tokensAndPairs.tokens);
  const [filterState, setFilterStatus] = useState(filtersText.includes(filter) ? filtersText.indexOf(filter) : 'all')

  function filterResult(item, filter) {
    if (filtersText[filter] === 'all') return item;
    return item.filter(elem => elem.status === filtersCode[filter]);
  }
  
	return (
		<PageWrapper title={combineMenu.launchpad.text}>
			<Page container='fluid'>
        <Alert color='primary' isLight isDismissible icon='Warning' rounded={0} >
          StrataLaunch works best with Metamask <Icon icon='Star' />
        </Alert>
        <div className='row'>
          <div className='col-xl-12'>
            <Card
            className='rounded-0 card-strech-full'
            border={1}
            shadow='sm'
            >
              <CardHeader>
                <CardLabel icon={'Cases'}>
                  <CardTitle tag='h4' className='h5'>All Tokens</CardTitle>
                </CardLabel>
                <CardActions className='d-flex'>
                  <Button 
                  size='sm' 
                  isLight 
                  rounded={0} 
                  color='primary' 
                  isOutline 
                  onClick={() => navigate('/dashboard/launchpad')}>
                    Create Presale
                    <Icon icon='ArrowForward' />
                  </Button>

                  <Dropdown>
                    <DropdownToggle>
                      <Button rounded={0} color='success' isLight className='text-capitalize'>Filter By: {filtersText[filterState]}</Button>
                    </DropdownToggle>
                    <DropdownMenu>
                      { filtersText.map((item, idx) => (
                        <DropdownItem key={idx}>
                          <Button onClick={()=>setFilterStatus(idx)} className='text-capitalize'>{item}</Button>
                        </DropdownItem>
                      )) }
                    </DropdownMenu>
                  </Dropdown>
                </CardActions>
              </CardHeader>

              <CardBody>
                { filterResult(tokensAndPairs, filterState).length < 1 ? (<>
                  <div className='text-center text-muted'>
                    <Icon size='5x' icon='AccessTime' />
                    <h3>No <span className='text-capitalize'>{filterState === 0 ? filtersText[filterState] : `Presale ${filtersText[filterState]}`}</span> Tokens</h3>
                    <Button size='sm' isLight rounded={0} color='primary' isOutline onClick={() => navigate('/dashboard/launchpad')}>
                      Create Presale <Icon icon='ArrowForward' />
                    </Button>
                  </div>
                </>) : (<>
                  <table className='table table-modern table-hover'>
                    <tbody>
                      {filterResult(tokensAndPairs, filterState).map((i, index) => (
                        <TableRow key={i.tokenaddress} {...i} index={index + 1} />
                      ))}
                    </tbody>
                  </table>
                </>) }
              </CardBody>
            </Card>
          </div>
        </div>
			</Page>
		</PageWrapper>
	);
};

export default Dashboard;
