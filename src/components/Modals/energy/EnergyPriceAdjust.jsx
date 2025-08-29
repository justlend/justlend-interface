import React from 'react';
import { Modal, Checkbox } from 'antd';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { LinkButton } from '../../Common/LinkButton';
import EnergyDownWhite from './assets/images/energydown-white.png';
import EnergyDownBlack from './assets/images/energydown-black.png';
import './assets/energydown.scss';

@inject('lend')
@inject('network')
@observer
export class EnergyPriceAdjustModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      checked: false
    };
  }
  componentDidMount() {}

  setModalStatus = () => {
    this.props.lend.setData({ hideEnergyPriceAdjustModal: true });
    window.localStorage.setItem('hideEnergyPriceAdjustModal', 'true');
  };

  render() {
    const { lang } = this.state;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    return (
      <Modal
        width={mobile ? 'calc(100vw - 30px)' : '400px'}
        visible={
          !this.props.lend.noServiceModalAllVisible &&
          !this.props.lend.hideEnergyPriceAdjustModal &&
          this.props.lend.serviceInnerStatus !== 'disabled'
        }
        wrapClassName={'energydownModal ' + theme + ' ' + lang}
        footer={null}
        zIndex={99999}
        onCancel={() => this.setModalStatus()}
        title={intl.get('energydown.cut')}
      >
        <div className="content">
          <div className="downImg">
            <img src={isWhite ? EnergyDownWhite : EnergyDownBlack} alt="" />
          </div>
          <p>{intl.get('energydown.user')}</p>
          <p>{intl.get('energydown.down')}</p>
          <div className="rule">
            <LinkButton
              href={'https://support.justlend.org/hc/en-us/articles/32539144305305'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                this.setModalStatus();
              }}
            >
              {intl.get('energydown.rule')}
            </LinkButton>
          </div>
          <div
            className="rent"
            onClick={() => {
              this.setModalStatus();
              if (window.location.pathname !== '/energy') {
                const energyLink = window.location.origin + '/energy?lang=' + lang;
                window.open(energyLink, '_self');
              }
            }}
          >
            {window.location.pathname === '/energy' ? intl.get('energydown.got_it') : intl.get('energydown.rent')}
          </div>
        </div>
      </Modal>
    );
  }
}

const mobile = isMobile(window.navigator).any;
