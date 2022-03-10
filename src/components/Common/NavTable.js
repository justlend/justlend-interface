import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Progress, Tooltip } from 'antd';
import MortgageModal from '../Modals/Mortgage';
import ToggleSwitch from '../Widget/ToggleSwitch';
import Config from '../../config';
import {
  emptyReactNode,
  formatNumber,
  BigNumber,
  getJTokenLogo,
  getTotalApy,
  toFixedDown,
  getLogo
} from '../../utils/helper';
import '../../assets/css/home.scss';
import defaultIcon from '../../assets/images/default.svg';
import closeImg from '../../assets/images/closeBlack.svg';

@inject('network')
@inject('lend')
@inject('pool')
@observer
class CommonTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      toast: !window.localStorage.getItem('hideWarningTips'),
      mobile: isMobile(window.navigator).any
    };
  }

  getSwitchStatus = (text, row) => {
    const jtoken = row.jtokenAddress;
    const { marketList } = this.props.lend;
    let status = 0;
    if (marketList[jtoken] && BigNumber(marketList[jtoken].collateralFactor).eq(0)) {
      status = 2;
    } else {
      status = Number(text);
    }
    return status;
  };

  getLendColumns = () => {
    const { lang } = this.state;
    const columns = [
      {
        title: intl.get('index.my_asset'),
        dataIndex: 'collateralSymbol',
        key: 'collateralSymbol',
        // width: 140,
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={item.logoUrl ? item.logoUrl : defaultIcon}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              <div className="token-names fw500">{`${text}`}</div>
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
        )
      },
      {
        title: `${'APY / ' + intl.get('index.my_interest')}`,
        dataIndex: 'lendApy',
        key: '2',
        width: 150,
        render: (text, item) => (
          <div>
            <p className="fw500">
              {formatNumber(text, 2, { miniText: 0.01, per: true })}
              {'%'}
            </p>
            <p>
              {formatNumber(item.interest, 3)} {item.collateralSymbol}
            </p>
          </div>
        )
      },
      {
        title: intl.get('index.my_shouldreturn'),
        dataIndex: 'borrowBalanceNew',
        key: '3',
        width: 150,
        render: (text, item) => (
          <div>
            <p className="fw500">
              {formatNumber(BigNumber(item.borrowBalanceNewUsd), 2, { miniText: 0.01, needDolar: true, round: true })}
            </p>
            <p>
              {formatNumber(BigNumber(text).div(item.precision), 3, { miniText: 0.001, round: true })}{' '}
              {item.collateralSymbol}
            </p>
          </div>
        )
      },

      {
        title: intl.get('index.my_proportionofloans'),
        dataIndex: 'per',
        key: '4',
        width: 200,
        render: text => (
          <div className="progress-td flex-between">
            <Progress
              strokeWidth={4}
              strokeColor="#3D56D6"
              showInfo={false}
              percent={BigNumber(text).gt(100) ? '100' : formatNumber(BigNumber(text), 2, { round: true, per: true })}
            />
            <span className="fw500">
              {BigNumber(text).gt(100)
                ? '100%'
                : formatNumber(BigNumber(text), 2, { miniText: 1, round: true, per: true }) + '%'}
            </span>
          </div>
        )
      }
    ];
    return columns;
  };

  getLendColumnsNew = () => {
    const { lang } = this.state;
    const columns = [
      {
        title: intl.get('index.my_asset'),
        dataIndex: 'collateralSymbol',
        key: 'collateralSymbol',
        // width: 140,
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={item.logoUrl ? item.logoUrl : defaultIcon}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              <div className="token-names fw500">{`${text}`}</div>
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
        )
      },
      {
        title: intl.get('borrow.borrowapy'),
        dataIndex: 'lendApy',
        key: '4',
        render: (text, item) => {
          return (
            <div>
              <p className="fw500 single">{formatNumber(BigNumber(text), 2, { per: true, miniText: '0.01' })}%</p>
            </div>
          );
        }
      },
      {
        title: this.renderInterestHeader(),
        dataIndex: 'lendApy',
        key: '2',
        width: 150,
        render: (text, item) => (
          <div>
            <p className="fw500">{formatNumber(BigNumber(item.interestUsd), 2, { miniText: 0.01, needDolar: true })}</p>
            <p>
              {formatNumber(item.interest, 3)} {item.collateralSymbol}
            </p>
          </div>
        )
      },
      {
        title: intl.get('index.my_totalrepayable'),
        dataIndex: 'borrowBalanceNew',
        key: '3',
        width: 150,
        render: (text, item) => (
          <div>
            <p className="fw500">
              {formatNumber(BigNumber(item.borrowBalanceNewUsd), 2, { miniText: 0.01, needDolar: true })}
            </p>
            <p>
              {formatNumber(BigNumber(text).div(item.precision), 3, { miniText: 0.001 })} {item.collateralSymbol}
            </p>
          </div>
        )
      },

      {
        title: intl.get('index.my_proportionofloans'),
        dataIndex: 'per',
        key: '4',
        width: 200,
        render: text => (
          <div className="progress-td flex-between">
            <Progress
              strokeWidth={4}
              strokeColor="#3D56D6"
              showInfo={false}
              percent={BigNumber(text).gt(100) ? '100' : formatNumber(BigNumber(text), 2, { round: true, per: true })}
            />
            <span className="fw500">
              {BigNumber(text).gt(100)
                ? '100%'
                : formatNumber(BigNumber(text), 2, { miniText: 1, round: true, per: true }) + '%'}
            </span>
          </div>
        )
      }
    ];
    return columns;
  };

  renderHeader = () => {
    return (
      <>
        {intl.get('index.return')}
      </>
    );
  };

  renderInterestHeader = () => {
    return (
      <>
        {intl.get('index.my_interest')}
        {
          <Tooltip title={intl.get('index.my_introduction13')} placement="bottom">
            <span className="tooltip-icon info-icon"></span>
          </Tooltip>
        }
      </>
    );
  };

  renderSunRewards = item => {
    const { assetList } = this.props.lend;
    let toBeGotSun = '--';
    try {
      if (assetList[item.jtokenAddress].toBeGotSun) {
        toBeGotSun = assetList[item.jtokenAddress].toBeGotSun;
      }
    } catch (error) {
      console.log('renderSunRewards error', error);
    }
    return toBeGotSun;
  };

  getDepositColumns = () => {
    const { lang = 'en-US' } = this.state;
    const sunSwap = lang === 'en-US' ? Config.sunSwap.en : Config.sunSwap.zh;
    const columns = [
      {
        title: intl.get('index.my_asset'),
        dataIndex: 'collateralSymbol',
        key: '1',
        // width: 140,
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={getJTokenLogo(item.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              <div className="token-names fw500">{`${text}`}</div>
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
        )
      },
      {
        title: this.renderHeader(), //`${intl.get('index.return')}`,
        dataIndex: 'earned',
        key: '2',
        render: (text, item) => {
          return (
            <div>
              <p className="fw500">
                {formatNumber(item.earned, 3)} {item.collateralSymbol}
              </p>
              <p>
                {`${formatNumber(this.renderSunRewards(item), 3)} SUNOLD`}
              </p>
            </div>
          );
        }
      },
      {
        title: intl.get('index.my_deposited'),
        dataIndex: 'deposited_usd',
        key: '3',
        render: (text, item) => (
          <div>
            <p className="fw500">{formatNumber(BigNumber(text), 2, { miniText: 0.01, needDolar: true })}</p>
            <p>
              {formatNumber(BigNumber(item.deposited), 3, { miniText: 0.001 })} {item.collateralSymbol}
            </p>
          </div>
        )
      },

      {
        title: intl.get('index.my_usedto'),
        dataIndex: 'account_entered',
        key: 'account_entered',
        width: 130,
        render: (text, item) => {
          return text === 2 ? (
            <button disabled="disabled">{intl.get('index.not_support')}</button>
          ) : (
            <div className={text === 1 ? 'my-switch on' : 'my-switch'}>
              <ToggleSwitch
                on={text === 1}
                lang={lang}
                onClick={() => {
                  this.onSwitchChange(text === 1, item);
                }}
              ></ToggleSwitch>
            </div>
          );
        }
      }
    ];
    return columns;
  };

  getDepositColumnsNew = () => {
    const { lang = 'en-US' } = this.state;
    const sunSwap = lang === 'en-US' ? Config.sunSwap.en : Config.sunSwap.zh;
    const columns = [
      {
        title: intl.get('index.my_asset'),
        dataIndex: 'collateralSymbol',
        key: '1',
        // width: 140,
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={getJTokenLogo(item.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              <div className="token-names fw500">{`${text}`}</div>
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
        )
      },
      {
        title: intl.get('market.baseAPY'),
        dataIndex: 'depositApy',
        key: '4',
        render: (text, item) => {
          return (
            <div>
              <p className="fw500 single">{formatNumber(BigNumber(text), 2, { per: true, miniText: '0.01' })}%</p>
            </div>
          );
        }
      },
      {
        title: this.renderHeader(), //`${intl.get('index.return')}`,
        dataIndex: 'earned',
        key: '2',
        render: (text, item) => {
          // const { assetList } = this.props.lend;
          // const { totalApy } = getTotalApy(item, assetList);

          return (
            <div>
              <p className="fw500">
                {formatNumber(BigNumber(item.earnedUsd), 2, {
                  miniText: 0.01,
                  needDolar: true,
                  round: true
                })}
              </p>
              <p>
                {formatNumber(item.earned, 3)} {item.collateralSymbol}
              </p>
            </div>
          );
        }
      },
      {
        title: intl.get('index.my_depositedNew'),
        dataIndex: 'deposited_usd',
        key: '3',
        render: (text, item) => (
          <div>
            <p className="fw500">{formatNumber(BigNumber(text), 2, { miniText: 0.01, needDolar: true })}</p>
            <p>
              {formatNumber(BigNumber(item.deposited), 3, { miniText: 0.001 })} {item.collateralSymbol}
            </p>
          </div>
        )
      },

      {
        title: intl.get('index.my_usedto'),
        dataIndex: 'account_entered',
        key: 'account_entered',
        width: 130,
        render: (text, item) => {
          return text === 2 ? (
            <button disabled="disabled">{intl.get('index.not_support')}</button>
          ) : (
            <div className={text === 1 ? 'my-switch on' : 'my-switch'}>
              <ToggleSwitch
                on={text === 1}
                lang={lang}
                onClick={() => {
                  this.onSwitchChange(text === 1, item);
                }}
              ></ToggleSwitch>
            </div>
          );
        }
      }
    ];
    return columns;
  };

  getMintColumns = () => {
    const columns = [
      {
        title: intl.get('index.my_asset'),
        dataIndex: 'symbol',
        key: '1',
        // width: 140,
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={getLogo(item.symbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              {/* <div className="token-names fw500">{text === 'JSTNEW' ? 'JST' : `${text}`}</div> */}
              <div className="token-names fw500">{text.replace('NEW', '')}</div>
              <div className="description">{`${item.name}`}</div>
            </div>
            {item.symbol === 'JSTNEW' || item.symbol === 'NFTNEW' ? (
              <span className="blue-icon">{intl.get('index.deposit_mining')}</span>
            ) : (
              <span className="pink-icon">{intl.get('index.century_mining')}</span>
            )}
          </div>
        )
      },
      {
        title: intl.get('index.my_miningrewards_soon'),
        dataIndex: 'gainNew',
        key: '2',
        render: (text, item) => {
          return (
            <div>
              <p className="fw500">
                {formatNumber(BigNumber(text).times(item.price), 2, { miniText: 0.01, needDolar: true })}
              </p>
              <p>
                {formatNumber(BigNumber(text), 3, { miniText: 0.001 })} {item.symbol.replace('NEW', '')}
              </p>
            </div>
          );
        }
      },
      {
        title: intl.get('index.my_miningrewards_freeze'),
        dataIndex: 'gainOld',
        key: '3',
        render: (text, item) => (
          <div>
            <p className="fw500">
              {formatNumber(BigNumber(text).times(item.price), 2, { miniText: 0.01, needDolar: true })}
            </p>
            <p>
              {formatNumber(BigNumber(text), 3, { miniText: 0.001 })} {item.symbol.replace('NEW', '')}
            </p>
          </div>
        )
      }
    ];
    return columns;
  };

  getColumns = type => {
    const { multyRealStart } = this.props.network;
    if (type === 'lend') {
      if (multyRealStart) {
        return this.getLendColumnsNew();
      } else {
        return this.getLendColumns();
      }
    } else if (type === 'mint' && multyRealStart) {
      return this.getMintColumns();
    } else {
      if (multyRealStart) {
        return this.getDepositColumnsNew();
      } else {
        return this.getDepositColumns();
      }
    }
  };

  onSwitchChange = (status, item) => {
    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    // const { userList } = this.props.lend;
    this.props.lend.setData({ visible: true, type: status ? 2 : 1, jtokenAddress }, 'mortgageModalInfo');
  };

  showDAW = (popData, activeKey, cb) => {
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData: popData,
        cb
      }
    });
  };

  clickRow = (row, type) => {
    if (type === 'deposit') {
      return this.showDAW(row, '2');
    }
    return this.props.lend.showBorrowModal(row, '2');
  };

  hideToast = () => {
    this.setState({ toast: false });
    window.localStorage.setItem('hideWarningTips', true);
  };

  getY = type => {
    let bannerHeight = 106;
    const { hideHomeBanner } = this.props.pool;
    if (hideHomeBanner) {
      bannerHeight = 0;
    }

    const { toast } = this.state;
    if (type === 'lend') {
      return 294 - bannerHeight;
    } else if (type === 'mint') {
      return 204 - bannerHeight;
    } else if (toast) {
      return 241 - bannerHeight;
    } else {
      return 294 - bannerHeight;
    }
  };

  render() {
    const { type } = this.props;
    const { toast, lang } = this.state;
    const { userDataSource, userDepositDataSource, userLendDataSource, mortgageModalInfo, userCurrencyData } =
      this.props.lend;
    // const { btcstStart } = this.props.network;
    let dataSource = userDataSource;
    if (type === 'lend') {
      dataSource = userLendDataSource;
    } else if (type === 'mint') {
      dataSource = userCurrencyData;
    } else {
      dataSource = userDepositDataSource;
    }
    const { multyRealStart } = this.props.network;
    let tableNames = '';
    if (multyRealStart && type === 'mint') {
      tableNames += 'mint-table ';
    }
    if (multyRealStart && type === 'lend') {
      tableNames += 'lend-table ';
    }
    if (!dataSource || dataSource.length === 0) {
      tableNames += 'no-data';
    }

    return (
      <div className={'userTable'}>
        {type === 'deposit' && toast === true && (
          <div className="warning-tip">
            <div>
              <span className="icon">!</span>
              {intl.get('toast.warning_tip')}
              <a href={lang === 'en-US' ? Config.learnMoreEn : Config.learnMoreCn} target="learnMore">
                {intl.get('toast.warning_tip_more')}
              </a>
            </div>
            <img src={closeImg} onClick={() => this.hideToast()} />
          </div>
        )}
        <Table
          className={tableNames}
          onRow={(row, index) => {
            return {
              onClick: e => {
                if (type !== 'mint') {
                  this.clickRow(row, type);
                }
              }
            };
          }}
          columns={this.getColumns(type)}
          dataSource={dataSource}
          pagination={false}
          locale={{
            emptyText: emptyReactNode(type)
          }}
          scroll={{
            y: this.getY(type)
          }}
        />
        {mortgageModalInfo.visible && <MortgageModal></MortgageModal>}
      </div>
    );
  }
}

export default CommonTable;
