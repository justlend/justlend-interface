import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import Config from '../../../config';
import CollateralLimitImg from '../../../assets/images/v2/userlist/progress1.png';

@inject('lend')
@observer
class CollateralLimit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = () => {
    document.body.style.overflow = 'hidden';
  };

  componentWillUnmount() {
    document.body.style.overflow = 'auto';
  }

  render() {
    const { totalCollateralShow, hideTotalCollateralPop } = this.props.lend;
    const { lang } = this.state;

    return (
      <Modal
        visible={totalCollateralShow}
        title={intl.get('collateral_tip_title')}
        width={400}
        centered
        footer={null}
        className={'j-modal header-border '}
        onCancel={() => hideTotalCollateralPop()}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <img className="collateral-limit-img" src={CollateralLimitImg} alt="" />
        <div className={'collateral-limit' + (lang === 'zh-CN' ? ' tac' : '')}>{intl.getHTML('v2.tip26')}</div>
        <button className="j-large-btn j-supply collateral-limit-btn" onClick={() => hideTotalCollateralPop()}>
          {intl.get('collateral_ok')}
        </button>
      </Modal>
    );
  }
}

export default CollateralLimit;
