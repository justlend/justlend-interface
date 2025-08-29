import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import '../../assets/css/v2/footer.scss';
import { getQueryObj, isMobile } from '../../utils/helper';
import config from '../../config';

const HelpCenter = {
  'zh-CN': 'https://justlendorg.zendesk.com/hc/zh-cn',
  'en-US': 'https://justlendorg.zendesk.com/hc/en-us',
  'zh-TC': 'https://justlendorg.zendesk.com/hc/zh-cn'
};
const TermsOfService = {
  'zh-CN': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf',
  'en-US': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf',
  'zh-TC': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf'
};

@inject('network')
@inject('ui')
@inject('lend')
@observer
class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      blockNumber: '',
      lastNumer: ''
    };
    this.interval = null;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.lastNumer != nextProps.lend.latestBlockInfo?.number) {
      return {
        blockNumber: isNaN(Number(nextProps.lend.latestBlockInfo?.number))
          ? '--'
          : Number(nextProps.lend.latestBlockInfo?.number),
        lastNumer: isNaN(Number(nextProps.lend.latestBlockInfo?.number))
          ? '--'
          : Number(nextProps.lend.latestBlockInfo?.number)
      };
    } else {
      return '';
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState(prevState => {
        return {
          ...prevState,
          blockNumber: prevState.blockNumber + 1
        };
      });
    }, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { blockNumber } = this.state;
    const { showTabsBar } = this.props.ui;
    const lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale || 'en-US';
    return (
      <div className={'j-footer ' + (showTabsBar ? ' ' : 'hideTabsBar')}>
        <div className="j-footer-content">
          <div className="left">
            <div className="block">
              <span className="dot"></span>
              <span
                className="pointer"
                onClick={() => {
                  window.open(`${config.tronscanUrl}/blockchain/blocks`);
                }}
              >
                {intl.get('v2.tip35')}: {blockNumber && !isNaN(blockNumber) && blockNumber}
              </span>
            </div>
            <div className="links">
              <a href={lang === 'en-US' ? config.docsEn : config.docsCn} target="_blank" rel="noopener noreferrer">
                {intl.get('footer.develop')}
              </a>
              <a href={HelpCenter[lang]} target="_blank" rel="noopener noreferrer">
                {intl.get('navi.helpCenter')}
              </a>
              <a href={TermsOfService[lang]} target="_blank" rel="noopener noreferrer">
                {intl.get('wallet.service')}
              </a>
            </div>
          </div>
          <div className="right">
            <div className="social-icons">
              <a className="icon-wrap" href={config.twitter} target="twitter">
                <span className="icon twitter" />
              </a>
              <a className="icon-wrap" href={config.telegram} target="telegram">
                <span className="icon telegram" />
              </a>
              <a className="icon-wrap" href={config.discord} target="discord">
                <span className="icon discord" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;
