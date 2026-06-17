import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import Config from '../../../config';
import LightImg from '../../../assets/images/v2/app-light.png';

@inject('lend')
@inject('network')
@observer
class ApplicationTip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = () => {
    // document.body.style.overflow = 'hidden';
  };

  componentWillUnmount() {
    // document.body.style.overflow = 'auto';
  }

  close = () => {
    this.props.lend.setApplocationTipShow(false);
  };

  render() {
    const { theme, applocationTipShow, pre } = this.props.lend;
    const { lang } = this.state;

    return (
      <Modal
        visible={applocationTipShow}
        title={''}
        width={316}
        centered
        footer={null}
        className={'j-modal j-application-tip-modal' + (theme === 'white' ? ' white' : '')}
        closable={true}
        onCancel={() => {
          this.close();
        }}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <img className="app-light" src={LightImg} />
        <div className="app-des">{intl.getHTML('application.tip1')}</div>
        <Link
          className="app-close-btn"
          to={`/application?lang=${lang}${pre ? '&pre=' + pre : ''}`}
          onClick={() => {
            this.close();
          }}
        >
          {intl.get('application.go_apply')}
        </Link>
      </Modal>
    );
  }
}

export default ApplicationTip;
