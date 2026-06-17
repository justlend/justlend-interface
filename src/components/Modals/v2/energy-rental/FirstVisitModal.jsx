import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal } from 'antd';
import classnames from 'classnames';

import { getRentalGuideUrl } from '../../../v2/energy-rental/utils';

import '../../../../assets/css/v2/energy-rental/first-visit-modal.scss';

@inject('lend')
@inject('energyRental')
@observer
class FirstVisitModal extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  close = () => {
    this.props.energyRental.setData({
      firstVisitModalVisible: false
    });
  };

  render() {
    const { mobile } = this.state;
    const { theme, lang } = this.props.lend;
    const { firstVisitModalVisible } = this.props.energyRental;

    return (
      <Modal
        title={''}
        visible={firstVisitModalVisible}
        closable={false}
        destroyOnClose={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 335 : 400}
        centered
        className={`j-modal header-border ${theme} first-visit-modal ${lang}`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="first-visit-modal-content">
          <div className="first-visit-modal-bg"></div>

          <div className="first-visit-modal-title">{intl.get('energy_rental.first_visit_modal.modal_title')}</div>

          <div className="first-visit-modal-content-rows">
            <div className="first-visit-modal-content-row">{intl.get('energy_rental.first_visit_modal.row_1')}</div>
            <div className="first-visit-modal-content-row">{intl.get('energy_rental.first_visit_modal.row_2')}</div>
            <div className="first-visit-modal-content-row">{intl.get('energy_rental.first_visit_modal.row_3')}</div>
          </div>

          <a
            href={getRentalGuideUrl(lang)}
            target="_blank"
            rel="noreferrer"
            className="tutorial-link purple-link-btn hover"
            onClick={() => {}}
          >
            {intl.get('energy_rental.first_visit_modal.tutorial_btn')}
          </a>

          <button
            className="explore-btn"
            onClick={() => {
              this.close();
            }}
          >
            {intl.get('energy_rental.first_visit_modal.explore_btn')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default FirstVisitModal;
