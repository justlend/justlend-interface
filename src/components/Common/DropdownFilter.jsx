import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';

export const DropdownFilter = ({ title, selectedPrefix, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobile] = useState(isMobile(window.navigator).any);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelection = optionValue => {
    if (optionValue === 'ALL') {
      onChange(selectedOptions.length === options.length ? [] : options.map(option => option.value));
    } else {
      onChange(
        selectedOptions.includes(optionValue)
          ? selectedOptions.filter(item => item !== optionValue)
          : [...selectedOptions, optionValue]
      );
    }
  };

  const selectedCount = selectedOptions?.length;
  const isSelectedAll = selectedCount === options.length;

  return (
    <div className="dropdown-filter" ref={wrapperRef}>
      <button className={'dropdown-button' + (selectedCount > 0 ? ' active' : '')} onClick={() => setIsOpen(!isOpen)}>
        <span className={'dropdown-filter-icon'}></span>
        {selectedCount <= 0
          ? title
          : (
            <span>
              {selectedPrefix}
              {isSelectedAll ? intl.get('s7.all') : selectedOptions?.slice(0, 2).join(', ')}
              {(isSelectedAll || selectedCount <= 2) ? '' : intl.get('jlv2.home.and_more', { count: selectedCount })}
            </span>
          )
        }
        {selectedCount > 0 && <span className={'dropdown-clear-icon'} onClick={(e) =>  {e.stopPropagation(); onChange([]); setIsOpen(false)}}></span>}
      </button>

      {isOpen && (
        <div className="dropdown-panel">
          {options.length === 0 ? (
            <div className="dropdown-item">{intl.get('no_data')}</div>
          ) : (
            <div className="dropdown-item" onClick={() => handleSelection('ALL')}>
              <div className={'drop-input ' + (selectedCount === options.length ? 'checked' : '')}></div>
              <span>{intl.get('s7.all')}</span>
            </div>
          )}
          {options.length > 0 &&
            options.map(option => (
              <div key={option.value} className="dropdown-item" onClick={() => handleSelection(option.value)}>
                <div className={'drop-input ' + (selectedOptions.includes(option.value) ? 'checked' : '')}></div>
                <span>{option.label}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
