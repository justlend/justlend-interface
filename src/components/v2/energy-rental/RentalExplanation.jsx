import React, { useEffect, useState, useRef, useContext } from 'react';
import { observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { StoreContext } from '../../Context/StoreContext';
import rentalLinkSvg from '../../../assets/images/v2/energy-rental/rental-link.svg';
import rentalLinkSvgMobile from '../../../assets/images/v2/energy-rental/rental-link-mobile.svg';
import BigNumber from 'bignumber.js';

const RentalExplanation = () => {
  const mobile = isMobile(window.navigator).any;
  const { energyRental } = useContext(StoreContext);
  const { feeRatio, minFee, usageChargeRatio } = energyRental;
  const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;

  return (
    <div className={`rental-explanation-container ${lang === 'en-US' ? 'en' : ''}`}>
      <div className="rental-explanation-left">
        <div className="rental-explanation-title">{intl.get('energy_rental.prepayment_rent')}</div>
        <div className="rental-explanation-tip">{intl.get('energy_rental.prepayment_rent_tip')}</div>
        <div className="rental-explanation-item">
          <div className="rental-explanation-item-title">{intl.get('energy_rental.energy_fee')}</div>
          <div className="rental-explanation-item-value">
            <span>{'='}</span>
            <span className="ml-4">{intl.get('energy_rental.energy_fee_formula')}</span>
          </div>
        </div>
        <div className="rental-explanation-item">
          <div className="rental-explanation-item-title">{intl.get('energy_rental.security_deposit')}</div>
          <div className="rental-explanation-item-value">
            <span>{'='}</span>
            <span className="ml-4">{intl.get('energy_rental.security_deposit_formula')}</span>
          </div>
        </div>
        <div className="rental-explanation-item">
          <div className="rental-explanation-item-title">{intl.get('energy_rental.liquidation_penalty')}</div>
          <div className="rental-explanation-item-value">
            <div className="rental-explanation-item-value">
              <span>{'='}</span>
              <span className="ml-4">
                {intl.get('energy_rental.liquidation_penalty_formula', {
                  feeRatio: (Number(feeRatio) ? feeRatio.times(100).toString() : '--') + '%',
                  minFee: minFee?.toString() || '--'
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="rental-explanation-desc-container">
          <div className="rental-explanation-desc">{intl.get('energy_rental.prepayment_rent_desc')}</div>
        </div>
      </div>
      <div className="rental-explanation-divider"></div>
      <div className="rental-explanation-right">
        <div className="rental-explanation-title">{intl.get('energy_rental.refund_of_deposit')}</div>
        <div className="rental-explanation-tip">{intl.get('energy_rental.refund_of_deposit_tip')}</div>
        <div className={'rental-explanation-item' + (lang !== 'en-US' ? ' mt-6' : '')}>
          <div
            className={
              'rental-explanation-item-value reiv' + (mobile ? ' mobile' : '') + (lang === 'en-US' ? ' en' : '')
            }
          >
            {intl.getHTML('energy_rental.refund_amount_formula')}
          </div>
          <div
            className={
              'rental-explanation-item-title auto-width reit' +
              (mobile ? ' mobile' : '') +
              (lang === 'en-US' ? ' en' : '')
            }
          >
            {intl.get('energy_rental.unrecovered_energy_fee')}
          </div>
        </div>
        <div className={`rental-explanation-line ${lang === 'en-US' ? 'rental-explanation-line-en' : ''}`}>
          <img src={mobile ? rentalLinkSvgMobile : rentalLinkSvg} alt="rental-link" />
        </div>
        <div className="rental-explanation-item">
          <div className="rental-explanation-item-title">{intl.get('energy_rental.unrecovered_energy_fee')}</div>
          <div className="rental-explanation-item-value">
            <span>{'='}</span>
            <span className="ml-4">
              {intl.get('energy_rental.unrecovered_energy_fee_formula', {
                usageChrageRatio: usageChargeRatio.toString() || '--'
              })}
            </span>
          </div>
        </div>
        <div className="rental-explanation-desc-container">
          <div className="rental-explanation-desc">{intl.get('energy_rental.refund_of_deposit_desc')}</div>
        </div>
      </div>
    </div>
  );
};

export default observer(RentalExplanation);
