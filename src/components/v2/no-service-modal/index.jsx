import React from 'react';
import { Modal, Checkbox } from 'antd';
import './style.scss';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';

@inject('lend')
@inject('network')
@observer
export class NoServiceModalAll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: false
    };
  }
  componentDidMount() {}
  onClick = () => {
    const { checked } = this.state;
    if (!checked) {
      return;
    }
    const now = Date.now();
    window.localStorage.setItem('closedNoServiceModalAll', now);
    window.localStorage.setItem('serviceStatus', 'continue');
    this.props.lend.setNoServiceModalAllVisible(false);
    this.props.lend.setServiceInnerStatus('continue');
    setTimeout(() => {
      this.props.network.initWalletConnectionAndEvent();
    }, 500);
  };

  onChange = flag => {
    this.setState({
      checked: flag
    });
  };

  render() {
    const { checked } = this.state;
    const { dark } = this.props;
    return (
      <Modal
        closable={false}
        width={mobile ? 'calc(100vw - 40px)' : '460px'}
        visible={this.props.lend.noServiceModalAllVisible}
        wrapClassName={`no-service-modal-all${dark ? ' dark' : ''}`}
        footer={null}
        zIndex={99999}
      >
        <div className="content">
          <div className="icon"></div>
          <div className="textWrap">
            <p className="text">JustLend DAO 不對中國大陸用戶提供任何產品或服務。</p>
            <p className="text">JustLend DAO does not provide any products or services to users from Mainland China.</p>
          </div>

          <div className="checkbox-wrap">
            <Checkbox className="" onChange={e => this.onChange(e.target.checked)}>
              我不是中國大陸用戶並且承諾不在中國區域使用此產品。
              <br />
              <span className="en">
                I am not a user from Mainland China, and I promise that I am not using this product in Mainland China.{' '}
              </span>
            </Checkbox>
          </div>
          <div className="btn-wrap">
            <div
              onClick={() => {
                this.props.lend.setNoServiceModalAllVisible(false);
                this.props.lend.setServiceInnerStatus('disabled');
                window.localStorage.setItem('serviceStatus', 'disabled');
                this.props.network.closeConnect();
              }}
              className={'btn disabled canClick'}
            >
              停止使用 / Stop Using
            </div>
            <div onClick={this.onClick} className={'btn' + (checked ? '' : ' disabled')}>
              繼續使用 / Continue
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const mobile = isMobile(window.navigator).any;
