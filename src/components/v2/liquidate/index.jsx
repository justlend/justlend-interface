import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import moment from 'moment';
import { inject, observer } from 'mobx-react';
import Header from '../Header';
import SeasonToolBar from '../season/index';
import Footer from '../Footer';
import {
  formatNumber,
  BigNumber,
  emptyReactNodeNew,
  getLiquidJTokenLogo,
  getLiquidLogo,
  numberParser,
  skeletonRender,
  getBrowserInfo,
  getQueryObj
} from '../../../utils/helper';
import { Tooltip, Table, Select, Popover, Checkbox, Input, Button } from 'antd';
import { TooltipText } from '../strx/TooltipText';
import LiquidateModal from './LiquidateModal';
import ExceptionModal from './ExceptionModal';
import TransactionModal from '../../Modals/v2/Transaction';
import TabsBar from '../mobile/TabsBar';
import { getMarketData } from '../../../utils/backend';
import '../../../assets/css/v2/common.scss';
import '../../../assets/css/v2/liquidate.scss';
import '../../../assets/css/v2/liquidate-m.scss';
import '../../../assets/css/v2/theme.scss';
import { Config } from '../../../config';
const { feedbackUrl } = Config;
let timer = null;
let authTimer = null;

@inject('network')
@inject('ui')
@inject('lend')
@inject('system')
@observer
class Liquidate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      checkAll: true,
      defaultValueCollateral: [],
      checkAllDebt: true,
      defaultValueDebt: [],
      // totalCollateralTokenArr: [],
      refreshDate: moment().format('YYYY-MM-DD HH:mm'),
      dataInfo: {},
      pageLimit: 20,
      loadMoreIndex: 0,
      showLoadMore: false,
      errMsg: '',
      errMsg1: '',
      liquidateInfoShow: {},
      minRiskValue: '',
      maxRiskValue: '',
      debtTokenArr: []
    };
  }

  componentDidMount = async () => {
    document.title = 'Liquidate V1- JustLend DAO';
    this.props.network.on('connect', async () => {
      await this.props.lend.getLiquidateInfo();
      if (window.localStorage.getItem('need_reload')) {
        window.localStorage.removeItem('need_reload');
        window.location.reload();
      }
    });

    await this.props.lend.getLatestBlockInfo();
    await this.checkUSDJ();
    this.onCheckAllChangeDebt(true);
    this.onCheckAllChangeCollateral(true);
  };

  componentWillUnmount = () => {
    clearInterval(timer);
  };

  checkUSDJ = async () => {
    try {
      const res = await getMarketData();
      let marketData = res.data;
      let jtokenList = marketData.jtokenList;
      let isUSD1Exist = false;
      const tokenSymbols = [];
      const usd1Address = Object.keys(Config.tokens).find(addr => Config.tokens[addr].tokenSymbol === 'USD1');
      jtokenList.map(item => {
        tokenSymbols.push(item.collateralSymbol);
        if (item.collateralAddress === usd1Address) {
          isUSD1Exist = true;
        }
      });
      this.setState({
        debtTokenArr: isUSD1Exist ? Config.totalDebtTokenArrAfterProposal : Config.totalDebtTokenArrOnline
      });
    } catch (error) {
      console.log('checkUSDJ error: ', error);
    }
  };

  authorityJudge = () => {
    const { lang } = this.state;
    const { hasLiquidateBetaAuthority, applicationMap } = this.props.lend;

    if (
      (applicationMap?.liquidate?.phase === 1 && !hasLiquidateBetaAuthority) ||
      !applicationMap?.liquidate?.switchOn
    ) {
      clearTimeout(authTimer);
      // window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
    }
  };

  getUserData = async () => {
    const { isConnected } = this.props.network;

    if (isConnected) {
    }
  };

  getMarketData = async () => {
    await this.props.lend.getLiquidateInfo();

    // this.onCheckAllChangeDebt(true);
    // this.onCheckAllChangeCollateral(true);
    clearInterval(timer);
    timer = setInterval(() => {
      this.props.lend.getLiquidateInfo();
      this.setState({ refreshDate: moment().format('YYYY-MM-DD HH:mm') });
    }, 60000);
  };

  getInfoColumns = () => {
    const { mobile } = this.state;
    let columns = [
      {
        title: intl.get('liquidate.liquidate_account'),
        dataIndex: 'borrower',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: isMobile(window.navigator).any ? 60 : 360,
        render: (text, item) => {
          return (
            // <div className="liquidate-td account-td">{text}</div>
            <div className="liquidate-td account-td">{text.substr(0, 3) + '...' + text.substring(text.length - 3)}</div>
          );
        }
      },
      {
        title: (
          <span
            onClick={() => {
              window.gtag('event', 'liquidate_click_Collateral', {
                'event_category': 'liquidate',
                'event_label': 'liquidate_click_Collateral'
              });
            }}
            className="ant-table-column-title"
          >
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('liquidate.liquidate_tip1')}
              placement="top"
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon mr-4"></span>
            </Tooltip>
            {intl.get('liquidate.liquidate_collateral')}
          </span>
        ),
        dataIndex: 'totalCollateralUsd',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          return b.totalCollateralUsd - a.totalCollateralUsd;
        },
        showSorterTooltip: false,
        key: '2',
        align: 'left',
        render: (text, item) => {
          return (
            <>
              <div className="liquidate-td">
                {BigNumber(text).lt(1)
                  ? formatNumber(BigNumber(text), 18, { needDolar: true, cutZero: true })
                  : formatNumber(BigNumber(text), 2, { needDolar: true })}
              </div>
              <div className="liquidate-imgs">
                {item?.collateralTokenList?.map((token, index) => (
                  <img className="j-liquidate-td-logo" src={getLiquidJTokenLogo(token.symbol)} alt="" key={index} />
                ))}
              </div>
            </>
          );
        }
      },
      {
        title: (
          <span
            onClick={() => {
              window.gtag('event', 'liquidate_click_Debt', { 'event_category': 'liquidate', 'event_label': 'liquidate_click_Debt' });
            }}
            className="ant-table-column-title"
          >
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('liquidate.liquidate_tip2')}
              placement="top"
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon mr-4"></span>
            </Tooltip>
            {intl.get('liquidate.liquidate_debt')}
          </span>
        ),
        dataIndex: 'totalBorrowUsd',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          return b.totalBorrowUsd - a.totalBorrowUsd;
        },
        showSorterTooltip: false,
        key: '3',
        align: 'left',
        render: (text, item) => {
          return (
            <>
              <div className="liquidate-td">
                {BigNumber(text).lt(1)
                  ? formatNumber(BigNumber(text), 18, { needDolar: true, cutZero: true })
                  : formatNumber(BigNumber(text), 2, { needDolar: true })}
              </div>
              <div className="liquidate-imgs">
                {item.borrowTokenList.map((token, index) => (
                  <img className="j-liquidate-td-logo" src={getLiquidLogo(token.symbol)} alt="" key={index} />
                ))}
              </div>
            </>
          );
        }
      },
      {
        title: intl.get('liquidate.liquidate_risk_value'),
        dataIndex: 'risk',
        key: '5',
        align: 'left',
        render: (text, item) => {
          return (
            <div className={'liquidate-td' + (BigNumber(text).gt(1) ? ' red' : '')}>
              {formatNumber(BigNumber(text).times(100), 2)}
            </div>
          );
        }
      },
      {
        title: ' ',
        dataIndex: 'btn',
        key: '4',
        // fixed: 'right',
        width: 120,
        render: (text, item) => {
          return !BigNumber(item.risk).gte(1) ? (
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('liquidate.can_not_liquidate_tip')}
              placement={mobile ? 'topLeft' : 'top'}
              arrowPointAtCenter
            >
              <div className={'j-btn j-reward'} onClick={() => this.liquidateClick(item)}>
                {intl.get('liquidate.liquidate_liquidate')}
              </div>
            </Tooltip>
          ) : (
            <div className={'j-btn j-reward'} onClick={() => this.liquidateClick(item)}>
              {intl.get('liquidate.liquidate_liquidate')}
            </div>
          );
        }
      }
    ];
    return columns;
  };

  liquidateClick = item => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      window.localStorage.setItem('need_reload', true);
      return this.props.network.connectWalletV2();
    } else {
      window.localStorage.removeItem('need_reload');
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.system.clearRejectError();

    // if (!BigNumber(item.risk).gt(0.95)) return;
    this.setState({ dataInfo: item });
    this.props.lend.setLiquidateShow(true);
    window.gtag('event', 'liquidate_click_Liquidate', { 'event_category': 'liquidate', 'event_label': 'liquidate_click_Liquidate' });
  };

  riskFilterRender = () => {
    const { errMsg, errMsg1, lang, minRiskValue, maxRiskValue } = this.state;
    // const { minRiskValue, maxRiskValue } = this.props.lend;

    return (
      <>
        <Input
          className={'j-input search-token ' + (errMsg ? 'j-error-input' : '')}
          placeholder={intl.get('liquidate.liquidate_risk_value')}
          value={minRiskValue}
          onChange={e => this.minRiskChange(e.target.value)}
        />
        <em></em>
        <Input
          className={'j-input search-token ' + (errMsg1 ? 'j-error-input' : '')}
          placeholder={intl.get('liquidate.liquidate_risk_value')}
          value={maxRiskValue}
          onChange={e => this.maxRiskChange(e.target.value)}
        />
        <Button
          className="j-btn j-supply risk-filter-btn"
          disabled={errMsg || errMsg1 || (BigNumber(minRiskValue).isNaN() && BigNumber(maxRiskValue).isNaN())}
          onClick={this.riskFilterConfirm}
        >
          {intl.get('liquidate.risk.confirm')}
        </Button>
        {(errMsg || errMsg1) && (
          <div className={'risk-error-msg ' + (lang === 'en-US' ? 'en' : '')}>
            <em></em>
            <span>{errMsg || errMsg1}</span>
          </div>
        )}
      </>
    );
  };

  riskFilterMobileRender = () => {
    const { minRiskValue, maxRiskValue } = this.state;
    const { theme } = this.props.lend;

    return (
      <div className="liquidate-popover-block">
        <Popover
          content={this.riskFilterMobileContentRender()}
          trigger="click"
          overlayClassName={'j-wrapper liquidate-popover risk-filter-popover ' + theme}
          placement="bottom"
          // open={open}
          // onOpenChange={handleOpenChange}
        >
          <span
            className={
              'top-subtitle liquidate-select' +
              (!BigNumber(minRiskValue).isNaN() || !BigNumber(maxRiskValue).isNaN() ? ' liquidate-select-open' : '')
            }
          >
            {intl.get('liquidate.liquidate_risk_value')}
            <em></em>
          </span>
        </Popover>
      </div>
    );
  };

  riskFilterMobileContentRender = () => {
    const { errMsg, errMsg1, lang, minRiskValue, maxRiskValue } = this.state;

    return (
      <div className="risk-filter risk-filter-m">
        <div>
          <Input
            className={'j-input search-token ' + (errMsg ? 'j-error-input' : '')}
            placeholder={intl.get('liquidate.liquidate_risk_value')}
            value={minRiskValue}
            onChange={e => this.minRiskChange(e.target.value)}
          />
          <em className="short-line"></em>
          <Input
            className={'j-input search-token ' + (errMsg1 ? 'j-error-input' : '')}
            placeholder={intl.get('liquidate.liquidate_risk_value')}
            value={maxRiskValue}
            onChange={e => this.maxRiskChange(e.target.value)}
          />
        </div>
        <div>
          <Button
            className="j-btn j-supply risk-filter-btn"
            disabled={errMsg || errMsg1 || (BigNumber(minRiskValue).isNaN() && BigNumber(maxRiskValue).isNaN())}
            onClick={this.riskFilterConfirm}
          >
            {intl.get('liquidate.risk.confirm')}
          </Button>
        </div>
        {(errMsg || errMsg1) && (
          <div className={'risk-error-msg ' + (lang === 'en-US' ? 'en' : '')}>
            <em></em>
            <span>{errMsg || errMsg1}</span>
          </div>
        )}
      </div>
    );
  };

  riskFilterConfirm = () => {
    const { errMsg, errMsg1, minRiskValue, maxRiskValue } = this.state;

    let minValue = minRiskValue;
    let maxValue = maxRiskValue;
    if (BigNumber(minRiskValue).isNaN()) {
      minValue = 95;
    }

    if (errMsg || errMsg1) return;

    const { theme, liquidateInfo, liquidateOriginalInfo, liquidateShow } = this.props.lend;
    let accounts = liquidateOriginalInfo.accounts.filter(item => {
      if (BigNumber(maxValue).isNaN()) {
        return BigNumber(BigNumber(item.risk).times(100)).gte(minValue);
      }

      return (
        BigNumber(BigNumber(item.risk).times(100)).gte(minValue) &&
        BigNumber(BigNumber(item.risk).times(100)).lte(maxValue)
      );
    });

    this.props.lend.setLiquidateInfo({ ...liquidateInfo, accounts });
    this.props.lend.setMinRiskValue(minValue);
    this.props.lend.setMaxRiskValue(maxValue);

    window.gtag('event', 'liquidate_click_Screen', { 'event_category': 'liquidate', 'event_label': 'liquidate_click_Screen' });
  };

  minRiskChange = inputValue => {
    try {
      this.props.system.clearRejectError();

      const { valid, str } = numberParser(inputValue, 1);

      if (valid) {
        this.setState({ minRiskValue: str });
        let errMsg = '';
        if (BigNumber(str).isNaN()) {
          errMsg = '';
        } else if (BigNumber(str).lt(95)) {
          errMsg = intl.get('liquidate.risk.placeholder');
        } else {
          errMsg = '';
        }
        this.setState({ errMsg });

        if (!BigNumber(this.state.maxRiskValue).isNaN() && BigNumber(str).gt(this.state.maxRiskValue)) {
          let errMsg1 = intl.get('liquidate.risk.msg1', { number: str });
          this.setState({ errMsg1 });
        } else {
          this.setState({ errMsg1: '' });
        }
      }
    } catch (err) {
      console.log('minRiskChange ', err);
    }
  };

  maxRiskChange = inputValue => {
    try {
      this.props.system.clearRejectError();

      const { valid, str } = numberParser(inputValue, 1);

      if (valid) {
        this.setState({ maxRiskValue: str });
        let errMsg1 = '';
        if (BigNumber(str).isNaN()) {
          errMsg1 = '';
        } else if (BigNumber(str).lt(95)) {
          errMsg1 = intl.get('liquidate.risk.placeholder');
          // errMsg1 = intl.get('liquidate.liquidate_tip13');
        } else if (!BigNumber(this.state.minRiskValue).isNaN() && BigNumber(str).lt(this.state.minRiskValue)) {
          errMsg1 = intl.get('liquidate.risk.msg1', { number: this.state.minRiskValue });
        } else {
          errMsg1 = '';
        }
        this.setState({ errMsg1 });
      }
    } catch (err) {
      console.log('maxRiskChange ', err);
    }
  };

  totalCollateralContentRender = () => {
    const { checkAll, defaultValueCollateral, debtTokenArr } = this.state;
    const totalCollateralArr = debtTokenArr.map(item => {
      return 'j' + item;
    });

    return (
      <>
        <Checkbox
          className="j-check-all j-checkbox"
          onChange={e => this.onCheckAllChangeCollateral(e.target.checked)}
          checked={checkAll}
        >
          {intl.get('claim_trans_check_all')}
        </Checkbox>

        <Checkbox.Group
          className="j-check-group"
          defaultValue={defaultValueCollateral}
          onChange={this.onChangeCollateral}
          value={defaultValueCollateral}
        >
          {totalCollateralArr.map(item => (
            <div className="j-liquidate-item" key={item}>
              <Checkbox className="j-checkbox" value={item}>
                <div className="flex aic">
                  <img className="j-liquidate-logo" src={getLiquidJTokenLogo(item)} alt="" />
                  <span className="j-liquidate-unit"> {item}</span>
                </div>
              </Checkbox>{' '}
            </div>
          ))}
        </Checkbox.Group>
      </>
    );
  };

  onCheckAllChangeCollateral = checked => {
    let checkAll = checked;
    if (!checkAll) {
      this.setState({ defaultValueCollateral: [] });
    } else {
      window.gtag('event', 'liquidate_liquidatepop_click_Collateral', {
        'event_category': 'liquidate',
        'event_label': 'liquidate_liquidatepop_click_Collateral',
        'value': 'all'
      });
      let arr = this.state.debtTokenArr.map(item => 'j' + item);
      this.setState({ defaultValueCollateral: arr });
    }
    this.setState({ checkAll });
    // setCheckAll(checkAll);
  };

  onChangeCollateral = item => {
    let length = item?.length;
    let dataLength = this.state.debtTokenArr.length;

    if (length === dataLength) {
      this.setState({ checkAll: true });
    } else if (length < dataLength) {
      this.setState({ checkAll: false });
    }
    window.gtag('event', 'liquidate_liquidatepop_click_Collateral', {
      'event_category': 'liquidate',
      'event_label': 'liquidate_liquidatepop_click_Collateral',
      'value': item.toString()
    });
    this.setState({ defaultValueCollateral: item });
  };

  totalCollateralRender = () => {
    const { defaultValueCollateral } = this.state;

    return this.popoverRender(
      this.totalCollateralContentRender(),
      defaultValueCollateral.length !== this.state.debtTokenArr.length,
      intl.get('liquidate.liquidate_collateral')
    );
  };

  totalDebtRender = () => {
    const { defaultValueDebt } = this.state;

    return this.popoverRender(
      this.totalDebtContentRender(),
      defaultValueDebt.length !== this.state.debtTokenArr.length,
      intl.get('liquidate.liquidate_debt')
    );
  };

  popoverRender = (content, isSelectOpen, text) => {
    const { theme } = this.props.lend;

    return (
      <div className="liquidate-popover-block ">
        <Popover
          content={content}
          trigger="click"
          placement="bottom"
          overlayClassName={'j-wrapper liquidate-popover ' + theme}
        >
          <span className={'top-subtitle liquidate-select' + (isSelectOpen ? ' liquidate-select-open' : '')}>
            {text}
            <em></em>
          </span>
        </Popover>
      </div>
    );
  };

  totalDebtContentRender = () => {
    const { checkAllDebt, defaultValueDebt, debtTokenArr } = this.state;
    return (
      <>
        <Checkbox
          className="j-check-all j-checkbox"
          onChange={e => this.onCheckAllChangeDebt(e.target.checked)}
          checked={checkAllDebt}
        >
          {intl.get('claim_trans_check_all')}
        </Checkbox>

        <Checkbox.Group
          className="j-check-group"
          defaultValue={defaultValueDebt}
          onChange={this.onChangeDebt}
          value={defaultValueDebt}
        >
          {debtTokenArr.map(item => (
            <div className="j-liquidate-item" key={item}>
              <Checkbox className="j-checkbox" value={item}>
                <div className="flex aic">
                  <img className="j-liquidate-logo" src={getLiquidLogo(item)} alt="" />
                  <span className="j-liquidate-unit"> {item}</span>
                </div>
              </Checkbox>{' '}
            </div>
          ))}
        </Checkbox.Group>
      </>
    );
  };

  onCheckAllChangeDebt = checked => {
    let checkAllDebt = checked;
    if (!checkAllDebt) {
      this.setState({ defaultValueDebt: [] });
    } else {
      window.gtag('event', 'liquidate_liquidatepop_click_Debt', {
        'event_category': 'liquidate',
        'event_label': 'liquidate_liquidatepop_click_Debt',
        'value': 'all'
      });
      this.setState({ defaultValueDebt: this.state.debtTokenArr });
    }
    this.setState({ checkAllDebt });
  };

  onChangeDebt = item => {
    let length = item?.length;
    let dataLength = this.state.debtTokenArr.length;

    if (length === dataLength) {
      this.setState({ checkAllDebt: true });
    } else if (length < dataLength) {
      this.setState({ checkAllDebt: false });
    }
    window.gtag('event', 'liquidate_liquidatepop_click_Debt', {
      'event_category': 'liquidate',
      'event_label': 'liquidate_liquidatepop_click_Debt',
      'value': item.toString()
    });
    this.setState({ defaultValueDebt: item });
  };

  reset = () => {
    this.onCheckAllChangeDebt(true);
    this.onCheckAllChangeCollateral(true);
    this.props.lend.setLiquidateInfo(this.props.lend.liquidateOriginalInfo);
    this.props.lend.setMinRiskValue('');
    this.props.lend.setMaxRiskValue('');
    this.setState({ errMsg: '', errMsg1: '', minRiskValue: '', maxRiskValue: '' });
    // this.setState({ defaultValueCollateral: [], checkAll: false, defaultValueDebt: [], checkAllDebt: false });
    window.gtag('event', 'liquidate_click_Reset', { 'event_category': 'liquidate', 'event_label': 'liquidate_click_Reset' });
  };

  refreshDateFn = async () => {
    await this.props.lend.getLiquidateInfo();
    this.setState({ refreshDate: moment().format('YYYY-MM-DD HH:mm') });
    window.gtag('event', 'liquidate_click_Refresh', { 'event_category': 'liquidate', 'event_label': 'liquidate_click_Refresh' });
  };

  newIncludes = (arr1, arr2) => {
    return arr1.filter(item => {
      return arr2.includes(item);
    });
  };

  contentRender = marketDataSource => {
    const { refreshDate, lang, mobile } = this.state;
    const { theme } = this.props.lend;

    return (
      <div className="j-container pr">
        <div className="j-navi">
          <div className="j-navi-content ">
            <span className="current">{intl.get('jlv2.navibar.liquidation')}</span>
            <div>{intl.get('application.des4')}</div>
          </div>

          <div className="jl-feedback">
            <div className="feedback-link">
              <em className="feedback-icon"></em>
              <a className="jl-links" href={feedbackUrl} target="feedback">
                {intl.get('liquidate.feedback')}
              </a>
            </div>
            {/* <div className="feedback-title">
              <em className="feedback-title-icon liquidate-icon"></em>
              {intl.get('application.des2')}
            </div> */}
          </div>
        </div>

        <div className="liquidate-warning">
          <span>
            {/* {intl.get('liquidate.warning')}  */}
            {intl.get('disclaimer.new_tip')}{' '}
            <a
              href="https://docs.justlend.org/resources/risk_warning/#liquidation-tool-disclaimer"
              className="jl-links"
              target="disclaimer"
            >
              {intl.get('disclaimer.agree2')}
            </a>
          </span>
        </div>

        <div className="j-liquidate">
          <div className="liquidate-top">
            <div className="liquidate-top-left">
              <div className="top-title">{intl.get('liquidate.liquidate_high_risk_account')}</div>
              <div className="top-subtitle">{intl.get('liquidate.liquidate_high_risk_95_account')}</div>
            </div>
            <div className="liquidate-top-right">
              <div>{this.totalCollateralRender()}</div>
              <div>{this.totalDebtRender()}</div>
              <div className="risk-filter">{this.riskFilterRender()}</div>
              <div className="top-reset" onClick={this.reset}>
                {intl.get('liquidate.liquidate_reset')}
              </div>
              <div className="j-refresh" onClick={this.refreshDateFn}>
                <em></em>
                {intl.getHTML('liquidate.liquidate_update_time', { time: refreshDate })}
              </div>
            </div>
          </div>

          <div className="bs-list j-liquidate-table">
            <Table
              columns={this.getInfoColumns()}
              dataSource={marketDataSource}
              pagination={false}
              locale={{
                emptyText: emptyReactNodeNew
              }}
              scroll={{ x: isMobile(window.navigator).any ? 750 : 1100 }}
            />
          </div>
        </div>
      </div>
    );
  };

  mobileContentRender = marketDataSource => {
    const { refreshDate } = this.state;

    return (
      <div className="j-container j-liquidate-container-m">
        <div className="j-navi">
          <div className="j-navi-content">
            <span className="current">{intl.get('application.liquidation')}</span>
            <div>{intl.get('application.des4')}</div>
          </div>

          <div className="jl-feedback">
            <div className="feedback-link">
              <em className="feedback-icon"></em>
              <a className="jl-links" href={feedbackUrl} target="feedback">
                {intl.get('liquidate.feedback')}
              </a>
            </div>
            {/* <div className="feedback-title">
              <em className="feedback-title-icon"></em>
              {intl.get('application.des2')}
            </div> */}
          </div>
        </div>

        <div className="liquidate-warning">
          <span>
            {/* {intl.get('liquidate.warning')}  */}
            {intl.get('disclaimer.new_tip')}{' '}
            <a
              href="https://docs.justlend.org/resources/risk_warning/#liquidation-tool-disclaimer"
              className="jl-links"
              target="disclaimer"
            >
              {intl.get('disclaimer.agree2')}
            </a>
          </span>
        </div>

        <div className="j-liquidate">
          <div className="liquidate-top head">
            <TooltipText
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('liquidate.liquidate_high_risk_95_account')}
              placement="topLeft"
              arrowPointAtCenter
            >
              <span>{intl.get('liquidate.liquidate_high_risk_account')}</span>
            </TooltipText>

            <div className="j-refresh" onClick={this.refreshDateFn}>
              <em></em>
              {intl.getHTML('liquidate.liquidate_update_time', { time: refreshDate })}
            </div>
          </div>
          <div className="liquidate-top liquidate-top-sec">
            <div className="liquidate-tr">{this.totalCollateralRender()}</div>
            <div className="liquidate-tr">{this.totalDebtRender()}</div>
            <div className="liquidate-tr">{this.riskFilterMobileRender()}</div>
            <div className="top-reset" onClick={this.reset}>
              {intl.get('liquidate.liquidate_reset')}
            </div>
          </div>

          <div className="bs-list j-liquidate-table">
            {marketDataSource.length <= 0 ? emptyReactNodeNew() : this.liquidateMobileTableRender(marketDataSource)}
          </div>
        </div>
      </div>
    );
  };

  liquidateMobileTableRender = marketDataSource => {
    const { mobile } = this.state;

    return (
      <div className="liquidate-m-table">
        {marketDataSource.map(item => {
          return (
            <div className="liquidate-m-item" key={item.borrower}>
              <div className="flex">
                <div>
                  <div className="item-title">{intl.get('liquidate.liquidate_account')}</div>
                  <div className="item-content">
                    {/* {item.borrower} */}
                    {item.borrower.substr(0, 1) + '...' + item.borrower.substring(item.borrower.length - 3)}
                  </div>
                </div>
                <div>
                  <div className="item-title">{intl.get('liquidate.liquidate_risk_value')}</div>
                  <div className={'item-content' + (BigNumber(item.risk).gt(1) ? ' red' : '')}>
                    {formatNumber(BigNumber(item.risk).times(100), 2)}
                  </div>
                </div>
              </div>
              <div className="flex">
                <div>
                  <TooltipText
                    className="item-title"
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('liquidate.liquidate_tip1')}
                    placement="topLeft"
                    arrowPointAtCenter
                  >
                    <span>{intl.get('liquidate.liquidate_collateral')}</span>
                  </TooltipText>
                  <div className="item-content">
                    {BigNumber(item.totalCollateralUsd).lt(1)
                      ? formatNumber(BigNumber(item.totalCollateralUsd), 18, { needDolar: true, cutZero: true })
                      : formatNumber(BigNumber(item.totalCollateralUsd), 2, { needDolar: true })}
                    <div className="liquidate-imgs">
                      {item.collateralTokenList.map(token => (
                        <img className="j-liquidate-td-logo" src={getLiquidJTokenLogo(token.symbol)} alt="" />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <TooltipText
                    className="item-title"
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('liquidate.liquidate_tip2')}
                    placement="top"
                    arrowPointAtCenter
                  >
                    <span>{intl.get('liquidate.liquidate_debt')}</span>
                  </TooltipText>
                  <div className="item-content">
                    {BigNumber(item.totalBorrowUsd).lt(1)
                      ? formatNumber(BigNumber(item.totalBorrowUsd), 18, { needDolar: true, cutZero: true })
                      : formatNumber(BigNumber(item.totalBorrowUsd), 2, { needDolar: true })}
                    <div className="liquidate-imgs">
                      {item.borrowTokenList.map(token => (
                        <img className="j-liquidate-td-logo" src={getLiquidLogo(token.symbol)} alt="" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!BigNumber(item.risk).gt(1) ? (
                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={intl.get('liquidate.can_not_liquidate_tip')}
                  placement="top"
                  arrowPointAtCenter
                >
                  <div className={'j-large-btn loading-close'} onClick={() => this.liquidateClick(item)}>
                    {intl.get('liquidate.liquidate_liquidate')}
                  </div>
                </Tooltip>
              ) : (
                <div className={'j-large-btn loading-close'} onClick={() => this.liquidateClick(item)}>
                  {intl.get('liquidate.liquidate_liquidate')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  loadMore = () => {
    this.setState({ loadMoreIndex: this.state.loadMoreIndex + 1 });
  };

  marketDataFilter = () => {
    const { defaultValueCollateral, defaultValueDebt, pageLimit, loadMoreIndex } = this.state;
    const { liquidateInfo } = this.props.lend;

    let marketDataSource = [];

    // temp
    let accounts = liquidateInfo.accounts.map(item => {
      let borrowTokenArr = [];
      let collateralTokenArr = [];
      item?.borrowTokenList?.map(item => {
        borrowTokenArr.push(item.symbol);
      });
      item?.collateralTokenList?.map(item => {
        collateralTokenArr.push(item.symbol);
      });
      return { ...item, borrowTokenArr, collateralTokenArr, key: item.borrower };
    });

    marketDataSource = accounts.filter(item => {
      if (defaultValueCollateral.length === 0 && defaultValueDebt.length === 0) {
        return false;
      }

      if (defaultValueCollateral.length === 0) {
        return this.newIncludes(item.borrowTokenArr, defaultValueDebt).length > 0;
      }
      if (defaultValueDebt.length === 0) {
        return this.newIncludes(item.collateralTokenArr, defaultValueCollateral).length > 0;
      }
      return (
        this.newIncludes(item.collateralTokenArr, defaultValueCollateral).length > 0 &&
        this.newIncludes(item.borrowTokenArr, defaultValueDebt).length > 0
      );
    });
    // temp end

    marketDataSource = marketDataSource.map(item => {
      return { ...item, key: item.borrower };
    });

    let marketDataSourceShow = marketDataSource.slice(0, (loadMoreIndex + 1) * pageLimit);

    return { marketDataSource, marketDataSourceShow };
  };

  loadingRender = () => {
    const { theme } = this.props.lend;
    const { mobile } = this.state;

    return (
      <div className="j-container skeleton">
        {mobile && (
          <div className="j-navi-top-m">
            <div>{skeletonRender()}</div>
            <div>{skeletonRender()}</div>
          </div>
        )}
        <div className="j-navi">
          <div className="j-navi-content">
            {skeletonRender()}
            {skeletonRender()}
          </div>

          <div className="jl-feedback">
            <div className="feedback-link"></div>
            <div className="feedback-title">{skeletonRender()}</div>
          </div>
        </div>
        {mobile ? (
          <>
            {new Array(2).fill(1).map((item, index) => (
              <div className="j-liquidate" key={index}>
                <div className="skeleton-block skeleton-liquidate-list-m">
                  <div>
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div>
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div>
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div>
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div>
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div>
                    <div>{skeletonRender()}</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="j-liquidate">
            <div className="skeleton-block flex jcsb">
              <div style={{ width: '42%' }}>{skeletonRender()}</div>
              <div style={{ width: '42%' }}>{skeletonRender()}</div>
            </div>
            <div className="skeleton-space-block"></div>
            <div className="skeleton-block skeleton-liquidate-list">
              {new Array(20).fill(1).map((item, index) => (
                <div key={index}>{skeletonRender()}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { mobile, dataInfo, pageLimit, loadMoreIndex } = this.state;
    const { theme, liquidateShow, liquidateOriginalInfo, isDisclaimerStoraged } = this.props.lend;

    let { marketDataSource, marketDataSourceShow } = this.marketDataFilter();

    let isLoading = true;

    if (marketDataSource?.length || marketDataSource.length === 0) {
      isLoading = false;
    }

    return (
      <>
        <div className={'j-wrapper ' + theme + (mobile ? ' j-wrapper-m' : '')}>
          <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
          <SeasonToolBar pageName="liquidate" />
          {/* {!isDisclaimerStoraged ? (
            this.disclaimerContent()
          ) :  */}
          {isLoading ? (
            this.loadingRender()
          ) : (
            <>
              {!mobile ? this.contentRender(marketDataSourceShow) : this.mobileContentRender(marketDataSourceShow)}
              {marketDataSource.length > pageLimit && (loadMoreIndex + 1) * pageLimit < marketDataSource.length && (
                <div className="load-more">
                  <div className="flex aic jcc" onClick={() => this.loadMore()}>
                    {intl.get('liquidate.liquidate_more')}
                    <em></em>
                  </div>
                </div>
              )}
            </>
          )}

          <Footer />
        </div>
        {liquidateShow && <LiquidateModal dataInfo={dataInfo} />}
        {mobile && !liquidateShow && <TabsBar theme={theme} />}
        <ExceptionModal />
        {/* {mobile && <ToPCModal />} */}
        <TransactionModal />
      </>
    );
  }
}

export default Liquidate;
