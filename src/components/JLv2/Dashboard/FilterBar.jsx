import React, { useState, useEffect, useMemo } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { debounce } from 'lodash';
import Stores from '../../../stores';
import { formatTokenSymbol } from '../../../utils/formatters';
import { DropdownFilter } from '../../Common/DropdownFilter';

const FilterBar = observer(() => {
  const [searchTerm, setSearchTerm] = useState('');

  const { dashboardStore } = Stores;
  const { supplyTokens, collateralTokens, filters, activeTab } = dashboardStore;

  const supplyTokenOptions = supplyTokens.map(t => ({
    value: formatTokenSymbol(t.address, t.symbol),
    label: formatTokenSymbol(t.address, t.symbol),
    icon: t.icon
  }));
  const collateralTokenOptions = collateralTokens.map(t => ({
    value: formatTokenSymbol(t.address, t.symbol),
    label: formatTokenSymbol(t.address, t.symbol),
    icon: t.icon
  }));

  const debouncedSearch = useMemo(
    () =>
      debounce(val => {
        dashboardStore.setFilter('keyword', val);
      }, 500),
    []
  );

  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  useEffect(() => {
    return () => debouncedSearch.cancel(); 
  }, [debouncedSearch]);

  return (
    <div className="filter-bar">
      <div className="fb-item">
        {/* <span>{intl.get('jlv2.home.supply_token')}</span> */}
        <DropdownFilter
          title={activeTab === 'supply' ? intl.get('jlv2.home.supply_token') : intl.get('jlv2.market.borrowed_token')}
          selectedPrefix={<span className='dropdown-prefix'>{activeTab === 'supply' ? intl.get('jlv2.home.supply_select_prefix') : intl.get('jlv2.home.borrow_select_prefix')}</span>}
          options={supplyTokenOptions}
          selectedOptions={filters.supplyTokens}
          onChange={selection => dashboardStore.setFilter('supplyTokens', selection)}
        />
      </div>
      <div className="fb-item">
        {/* <span>{intl.get('jlv2.home.collateral_token')}</span> */}
        <DropdownFilter
          title={intl.get('jlv2.home.collateral_token')}
          selectedPrefix={<span className='dropdown-prefix'>{intl.get('jlv2.home.collateral_select_prefix')}</span>}
          options={collateralTokenOptions}
          selectedOptions={filters.collateralTokens}
          onChange={selection => dashboardStore.setFilter('collateralTokens', selection)}
        />
      </div>

      <div className="search-input-wrapper">
        <em className="search-icon"></em>
        <input
          type="text"
          className="search-input"
          placeholder={activeTab === 'supply' ? intl.get('jlv2.home.search_by_token'): intl.get('jlv2.home.search_by_token_borrow')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
      </div>
    </div>
  );
});

export default FilterBar;
