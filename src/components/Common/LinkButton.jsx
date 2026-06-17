import { observer } from 'mobx-react';
import React from 'react';
import Stores from '../../stores';
import '../../assets/css/v2/components/link-button.scss';

const LinkButton = observer(({ href = '', children = null, showArrow = true, className = '', ...others }) => {
  const { lend } = Stores;
  const { lang } = lend;
  const innerContent = (
    <>
      <span className={`link-button__text ${lang}`}>{children}</span>
      {showArrow ? <span className="link-button__arrow"></span> : null}
    </>
  );
  if (href) {
    return (
      <a className={`link-button${className ? ' ' + className : ''}`} {...others} href={href}>
        {innerContent}
      </a>
    );
  }
  return (
    <div className={`link-button${className ? ' ' + className : ''}`} {...others}>
      {innerContent}
    </div>
  );
});

export { LinkButton };
