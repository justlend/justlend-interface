import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button } from 'antd';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import Stores from '../../../stores';
import isMobile from 'ismobilejs';

import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import NoticeImg from '../../../assets/images/JLv2/notice-icon.svg';

const LIQUIDATION_NOTICE_STATUS = 'liquidationNoticeStatus';

const NoticeModal = observer(() => {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [mobile] = useState(isMobile(window.navigator).any);
  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const { lend } = Stores;
  const isWhite = lend.theme === 'white';

  useEffect(() => {
    const noticeStatus = window.localStorage.getItem(LIQUIDATION_NOTICE_STATUS);
    if (!noticeStatus || noticeStatus === 'false') {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    window.localStorage.setItem(LIQUIDATION_NOTICE_STATUS, 'false');
    setVisible(false);
    window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
  };

  const handleStart = () => {
    setVisible(false);
    window.localStorage.setItem(LIQUIDATION_NOTICE_STATUS, 'true');
  };

  return (
    <Modal
      visible={visible}
      footer={null}
      centered
      title={null}
      width={mobile ? 'auto' : 400}
      maskClosable={false}
      closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
      onCancel={handleClose}
      wrapClassName={`liquidationv2-notice-modal ${lend.theme}`}
    >
      <div className="notice-container">
        <div className="notice-header">
          <span className="notice-title">{intl.get('jlv2.liquidation.notice_title')}</span>
        </div>

        <div className="notice-content">
          <img src={NoticeImg} className="notice-warning-icon" />
          <div className="notice-text">{intl.get('jlv2.liquidation.notice_content')}</div>
        </div>

        <div className="notice-agreement">
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="custom-checkbox"
          >
            {intl.get('jlv2.liquidation.notice_agree')}：<a href="https://docs.justlend.org/resources/risk_warning/" target="_blank" rel="noopener noreferrer" className="notice-link">{intl.get('jlv2.liquidation.notice_terms')}</a>
          </Checkbox>
        </div>

        <div className="notice-footer">
          <Button
            className="btn-cancel"
            onClick={handleClose}
          >
            {intl.get('jlv2.liquidation.notice_btn_cancel')}
          </Button>
          <Button
            className={`btn-confirm ${agreed ? 'active' : ''}`}
            disabled={!agreed}
            onClick={handleStart}
          >
            {intl.get('jlv2.liquidation.notice_btn_confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default NoticeModal;