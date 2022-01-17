import React from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import { combineMenu } from '../../menu';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardSubTitle, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import Icon from '../../components/icon/Icon';
import classNames from 'classnames';
import useDarkMode from '../../hooks/useDarkMode';
import { useNavigate } from 'react-router-dom';
import Progress from '../../components/bootstrap/Progress';
import { useSelector } from 'react-redux';
import DefaultDashboard from './DefaultDashboard';
import { BitcoinBtcLogo, EthereumEthLogo, BinanceCoinBnbLogo, StrataTodayLogo, PancakeswapCakeLogo } from '../../components/icon/svg-icons';

const Dashboard = () => {
  const tokensAndPairs = useSelector(state => state.tokensAndPairs.tokens)
  const { darkModeStatus } = useDarkMode();
  const navigate = useNavigate();


  const sorted = tokensAndPairs.sort((first, second) => {
    if (first.participants > second.participants) return 1
    if (first.participants < second.participants) return -1
    return 0
  });

  const completedTokens = sorted.filter(x => x.status === '2').slice(0, 3);
  const liveTokens = sorted.filter(x => x.status === '1').slice(0, 3);
  
	return (
		<PageWrapper title={combineMenu.dashboard.text}>
			<Page container='fluid'>
        <div className='row'>
          {/* market value for top tokens */}
          <div className='col-md-12 mb-5'>
            <div className='intro-text d-flex align-items-center justify-content-between'>
              <div className='info_left'></div>
              <div className='info_right'>
                <div className='d-flex align-items-center justify-content-evenly' style={{width:300}}>
                  <div className='item d-flex align-items-center'>
                    <BinanceCoinBnbLogo width={30} />
                    <h6 style={{margin: '0px 0px 0px 5px'}} className={classNames({ 'text-light': darkModeStatus })}>$423.68</h6>
                  </div>
                  <div className='item d-flex align-items-center'>
                    <EthereumEthLogo width={20} />
                    <h6 style={{margin: '0px 0px 0px 5px'}} className={classNames({ 'text-light': darkModeStatus })}>$423.68</h6>
                  </div>
                  <div className='item d-flex align-items-center'>
                    <BitcoinBtcLogo width={30} />
                    <h6 style={{margin: '0px 0px 0px 5px'}} className={classNames({ 'text-light': darkModeStatus })}>$423.68</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='col-md-12'>
            <div className='row'>
              <div className='col-md-6'>
                <Card shadow='md' borderSize={1}>
                  <CardBody>
                    {/* <div style={{height:22}} /> */}
                    <div className='d-flex align-items-center'>
                      <StrataTodayLogo width={90} height={90} />
                      <div style={{marginLeft:10}}>
                        <h3>Buy StrataToday On</h3>
                        <Card className={classNames({'text-dark bg-l25-primary bg-l10-primary-hover': !darkModeStatus, 'text-light bg-lo50-primary bg-lo25-primary-hover': darkModeStatus})}>
                            <CardBody className='p-2 d-flex align-items-center justify-content-evenly'>
                              <PancakeswapCakeLogo width={20} />
                              <h6>PancakeSwap</h6>
                            </CardBody>
                          </Card>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className='col-md-6'>
                <Card shadow='md' borderSize={1}>
                  <CardBody className=''>
                    <h3><Icon color='primary' icon={'Launch'} /> StrataLaunch</h3>
                    <p>Save Valuable Time and Launch Your Project With the Security of our Platform!</p>
                    <Button onClick={() => navigate('dashboard/tokens/all')} size='sm' isLight rounded={0} color='primary' isOutline>View IDOs</Button>
                  </CardBody>
                </Card>
              </div>

              <div className='col-md-6'>
                <Card shadow='md' borderSize={1}>
                  <CardBody className=''>
                    {/* <div style={{height:20}} /> */}
                    <h3>Strata<strong>FairLaunch</strong></h3>
                    <p>Launch Your Project With Self Provided Liquidity!</p>
                    <Button size='sm' isLight rounded={0} color='primary' isOutline>Get Started</Button>
                  </CardBody>
                </Card>
              </div>

              <div className='col-md-6'>
                <Card shadow='md' borderSize={1}>
                  <CardBody className=''>
                    <h3>Strata<strong>Airdrop</strong></h3>
                    <p>Airdrop Tokens to Your Userbase With the Click of a Button!</p>
                    <Button onClick={() => navigate('dashboard/airdrop')} size='sm' isLight rounded={0} color='primary' isOutline>Get Started</Button>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>

          { sorted.length > 6 ? (<>
            { liveTokens && liveTokens.length >= 3 ? (<>
              <div className='col-xl-6'>
                <Card
                className='card-strech-full'
                style={{borderRadius:'0.5rem'}}
                shadow='sm'
                borderSize={1}>
                  <CardHeader>
                    <CardLabel icon={'Circle'}>
                      <CardTitle>Live Tokens</CardTitle>
                      <CardSubTitle><small>Order By: <strong>Popular</strong></small></CardSubTitle>
                    </CardLabel>
                    <CardActions>
                      <Button onClick={() => navigate(`dashboard/tokens/live`)} isOutline={true} color='primary' rounded={0}>View All </Button>
                    </CardActions>
                  </CardHeader>

                  <CardBody className='row g-4'>
                    <Card
                    className={classNames(
                      'col-md-6 transition-base rounded-0 mb-0 text-dark',
                      {
                        'bg-l25-warning bg-l10-warning-hover':
                          !darkModeStatus,
                        'bg-lo50-warning bg-lo25-warning-hover':
                          darkModeStatus,
                      },
                    )}
                    stretch
                    shadow='sm'>
                      {/* TODO: coin info goes here */}
                      <CardBody>
                        <div className='' style={{height:20}}></div>
                        <div className='text-center pb-3'>
                          <Icon icon={'Circle'} size='5x' />
                          <h3>{liveTokens[0].tokenname}</h3>
                          <div className='row mb-5'>
                            <div className='col-md-6'>
                              <span>BscScan <Icon icon={'ArrowUpRight'} /></span>
                            </div>
                            <div className='col-md-6 d-flex align-items-center justify-content-evenly'>
                              <Icon icon='Twitter' />
                              <Icon icon='Globe' />
                              <Icon icon='Telegram' />
                            </div>
                          </div>

                          <div className='presale-info'>
                            <h6 style={{textAlign:'left'}}>Presale status</h6>
                            <div className={classNames('p-2 rounded-2 mb-3',{
                              'bg-dark text-light': darkModeStatus,
                              'bg-light': !darkModeStatus
                            })}>
                              {`${liveTokens[0].currentCap}/${liveTokens[0].hardCap} ${liveTokens[0].pair}`}
                            </div>
                            <Progress value={liveTokens[0].currentCap} min={0} max={liveTokens[0].hardCap} isAutoColor isAnimated height={30} />

                            <div className='mt-5 d-flex align-items-center justify-content-between'>
                              <h6>{liveTokens[0].participants} participnts</h6>
                              <Button onClick={() => navigate('dashboard/token/'+liveTokens[0].tokenaddress)} isOutline isLight color='primary' rounded={0} isLink href='dashboard/tokens'>More <Icon icon={'ArrowForwardIos'} /></Button>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <div className='col-md-6'>
                      {liveTokens.slice(1, liveTokens.length+1).map((item, index) => (
                        <Card
                          key={index}
                          onClick={() => navigate('dashboard/token/'+item.tokenaddress)}
                          style={{cursor:'pointer'}}
                          className={classNames(
                            'transition-base rounded-0 mb-4 text-dark',
                            {
                              'bg-l25-secondary bg-l10-secondary-hover':
                                !darkModeStatus,
                              'bg-lo50-secondary bg-lo25-secondary-hover':
                                darkModeStatus,
                            },
                          )}
                          shadow='sm'>
                          <CardBody>
                            <div style={{height:50}}></div>
                            <div className='d-flex align-items-center pb-3 text-center'>
                              <div className='flex-shrink-0'>
                                <Icon
                                  icon='Circle'
                                  size='5x'
                                  color='secondary'
                                />
                                <h5>{item.tokenname}</h5>
                              </div>
                              <div className='flex-grow-1 ms-3'>
                                <div className={classNames('p-1 rounded-2 mb-3', {
                                  'bg-dark text-light': darkModeStatus,
                                  'bg-light text-dark': !darkModeStatus
                                })}>{`${item.currentCap}/${item.hardCap} ${item.pair}`}</div>
                                <Progress value={50} min={0} max={100} isAnimated isAutoColor height={20} />

                                <div className='mt-2 d-flex align-items-center justify-content-between'>
                                  <h6>{item.participants} participnts</h6>
                                  {/* TODO: calculate percentage increase */}
                                  <h6 className='text-success'>{100 * ((item.currentCap / 0) / 0)}% <Icon icon={'ArrowUp'} /></h6>
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>) : null }
              
            { completedTokens && completedTokens.length >= 3 ? (<>
              <div className='col-xl-6'>
                <Card
                className='col-xl-6 card-strech-full'
                style={{borderRadius:'0.5rem'}}
                shadow='sm'
                borderSize={1}>
                  <CardHeader>
                    <CardLabel iconColor='success' icon={'CheckCircle'}>
                      <CardTitle>Completed Tokens</CardTitle>
                      <CardSubTitle><small>Order By: <strong>Popular</strong></small></CardSubTitle>
                    </CardLabel>
                    <CardActions>
                      <Button onClick={() => navigate('dashboard/tokens/completed')} isOutline={true} color='success' rounded={0}>View All </Button>
                    </CardActions>
                  </CardHeader>

                  <CardBody className='row g-4'>
                    <Card
                      className={classNames(
                        'col-md-6 transition-base rounded-0 mb-0 text-dark',
                        {
                          'bg-l25-warning bg-l10-warning-hover':
                            !darkModeStatus,
                          'bg-lo50-warning bg-lo25-warning-hover':
                            darkModeStatus,
                        },
                      )}
                      stretch
                      shadow='sm'>
                        {/* TODO: coin info goes here */}
                      <CardBody>
                        <div className='' style={{height:20}}></div>
                        <div className='text-center pb-3'>
                          <Icon icon={'Circle'} size='5x' />
                          <h3>{completedTokens[0].tokenname}</h3>
                          <div className='row mb-5'>
                            <div className='col-md-6'>
                              <span>BscScan <Icon icon={'ArrowUpRight'} /></span>
                            </div>
                            <div className='col-md-6 d-flex align-items-center justify-content-evenly'>
                              <Icon icon='Twitter' />
                              <Icon icon='Globe' />
                              <Icon icon='Telegram' />
                            </div>
                          </div>

                          <div className='presale-info'>
                            <h6 style={{textAlign:'left'}}>Presale status</h6>
                            <div className={classNames('p-2 rounded-2 mb-3',{
                              'bg-dark text-light': darkModeStatus,
                              'bg-light': !darkModeStatus
                            })}>
                              {`${completedTokens[0].currentCap}/${completedTokens[0].hardCap} ${completedTokens[0].pair}`}
                            </div>
                            <Progress value={completedTokens[0].currentCap} min={0} max={completedTokens[0].hardCap} isAutoColor isAnimated height={30} />

                            <div className='mt-5 d-flex align-items-center justify-content-between'>
                              <h6>{completedTokens[0].participants} participnts</h6>
                              <Button onClick={() => navigate('dashboard/token/'+completedTokens[0].tokenaddress)} isOutline isLight color='primary' rounded={0}>More <Icon icon={'ArrowForwardIos'} /></Button>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <div className='col-md-6'>
                      {completedTokens.slice(1, completedTokens.length+1).map((item, index) => (
                        <Card
                          key={index}
                          onClick={() => navigate('dashboard/token/'+item.tokenaddress)}
                          style={{cursor:'pointer'}}
                          className={classNames(
                            'transition-base rounded-0 mb-4 text-dark',
                            {
                              'bg-l25-secondary bg-l10-secondary-hover':
                                !darkModeStatus,
                              'bg-lo50-secondary bg-lo25-secondary-hover':
                                darkModeStatus,
                            },
                          )}
                          shadow='sm'>
                          <CardBody>
                            <div style={{height:50}}></div>
                            <div className='d-flex align-items-center pb-3 text-center'>
                              <div className='flex-shrink-0'>
                                <Icon
                                  icon='Circle'
                                  size='5x'
                                  color='secondary'
                                />
                                <h5>{item.tokenname}</h5>
                              </div>
                              <div className='flex-grow-1 ms-3'>
                                <div className={classNames('p-1 rounded-2 mb-3', {
                                  'bg-dark text-light': darkModeStatus,
                                  'bg-light text-dark': !darkModeStatus
                                })}>{`${item.currentCap}/${item.hardCap} ${item.pair}`}</div>
                                <Progress value={50} min={0} max={100} isAnimated isAutoColor height={20} />

                                <div className='mt-2 d-flex align-items-center justify-content-between'>
                                  <h6>{item.participants} participnts</h6>
                                  {/* TODO: calculate percentage increase */}
                                  <h6 className='text-success'>{100 * ((item.currentCap / 0) / 0)}% <Icon icon={'ArrowUp'} /></h6>
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>) : null}


          </>) : (<>
            {/* if not enough presale tokens yet */}
            <DefaultDashboard />
          </>) }
        </div>
			</Page>
		</PageWrapper>
	);
};

export default Dashboard;
