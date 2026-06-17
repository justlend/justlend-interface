import { observer } from 'mobx-react';
import React from 'react';
import Stores from '../../stores';
import '../../assets/css/v2/components/simple-link.scss';

const SimpleLink = observer(({ href = '', children = null, showArrow = true, className = '', ...others }) => {
  const { lend } = Stores;
  const { lang, theme } = lend;
  const innerContent = (
    <>
      <span className={`link-text ${lang}`}>{children}</span>
      {showArrow ? <span className="link-arrow"></span> : null}
    </>
  );
  if (href) {
    return (
      <a className={`simple-link ${theme} ${className ? ' ' + className : ''}`} {...others} href={href}>
        {innerContent}
      </a>
    );
  }
  return (
    <div className={`simple-link ${theme} ${className ? ' ' + className : ''}`} {...others}>
      {innerContent}
    </div>
  );
});

export { SimpleLink };
