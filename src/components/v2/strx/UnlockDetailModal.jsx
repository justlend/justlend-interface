import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Tooltip } from 'antd';
import Config from '../../../config';
import { BigNumber, formatNumber, formatTime } from '../../../utils/helper';
import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import defaultDonutIcon from '../../../assets/images/v2/account/donut-default.svg';
import isMobile from 'ismobilejs';
import { TooltipText } from './TooltipText';

@inject('network')
@inject('lend')
@inject('system')
@inject('strx')
@observer
class UnlockDetailModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  render() {
    const { userData } = this.props.strx;
    const { accountWithDrawAmount, roundDetails } = userData;

    const { mobile } = this.state;
    let { theme } = this.props.lend;
    const isWhite = theme === 'white';
    return (
      <Modal
        title={intl.get('strx.stake_unstaking_details')}
        footer={null}
        onCancel={() => {
          this.props.setUnlockModalVisible(false);
          window.gtag('event', 'PC_stake_detail_modal_close', {
            'event_category': 'sTRX',
            'event_label': 'stake_detail_modal_close'
          });
        }}
        className={`unlock-modal${isWhite ? ' white' : ''}`}
        visible={this.props.visible}
        centered
        width={mobile ? 'calc(100vw - 40px)' : '400px'}
        closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
      >
        <div className="unlock-balance">
          <div>{intl.get('strx.stake_unstaking_total')}</div>
          <div className="amount">
            <SplitNumber value={`${formatNumber(accountWithDrawAmount, 3, { miniText: '0.001' })} TRX`}></SplitNumber>
          </div>
        </div>
        <div className="unlock-detail">
          <div className="top">
            <div className="title tooltip-text-wrap">{intl.get('strx.stake_avaiable_withdraw_time')}</div>
            <div>{intl.get('strx.stake_amount')}</div>
          </div>
          <ul className="list">
            {roundDetails.map((item, index) => {
              return (
                <li key={index}>
                  <span className="time flex-center">
                    {item.status === 2 ? (
                      <>
                        <TooltipText
                          overlayClassName="j-tooltip-dropdown"
                          title={intl.get('strx.stake_unlock_time_tip')}
                          placement="topRight"
                          arrowPointAtCenter
                          overlayStyle={{ maxWidth: '500px' }}
                          getPopupContainer={() => document.querySelector('.unlock-detail')}
                          onOpen={() => {
                            window.gtag('event', 'H5_stake_unlock_time_hover', {
                              'event_category': 'sTRX',
                              'event_label': 'stake_unlock_time_hover'
                            });
                          }}
                        >
                          ≈ {formatTime(Number(item.timestamp) * 1000)}
                        </TooltipText>
                        {mobile ? null : (
                          <Tooltip
                            overlayClassName="j-tooltip-dropdown"
                            title={intl.get('strx.stake_unlock_time_tip')}
                            placement="top"
                            arrowPointAtCenter
                            getPopupContainer={() => document.querySelector('.unlock-detail')}
                            overlayStyle={{ maxWidth: '500px' }}
                          >
                            <span
                              className="j-tooltip-icon"
                              onMouseEnter={() => {
                                window.gtag('event', 'PC_stake_unlock_time_hover', {
                                  'event_category': 'sTRX',
                                  'event_label': 'stake_unlock_time_hover'
                                });
                              }}
                            ></span>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      formatTime(Number(item.timestamp) * 1000)
                    )}
                  </span>

                  <span className="value">
                    <SplitNumber value={`${formatNumber(item.amount, 3, { miniText: '0.001' })} TRX`}></SplitNumber>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
    );
  }
}
function SplitNumber(props) {
  const { value } = props;
  const [a, b] = value.split('.');
  return (
    <>
      <span className="highlight">{a}</span>
      {b ? (
        <span className="normal" style={{ fontSize: 12 }}>
          .{b}
        </span>
      ) : (
        ''
      )}
    </>
  );
}
export default UnlockDetailModal;
