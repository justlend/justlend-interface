import { inject, observer } from 'mobx-react';
import React from 'react';
import '../../assets/css/v2/components/simple-link.scss';

@inject('lend')
@observer
class SimpleLink extends React.Component {
  render() {
    const { lang, theme } = this.props.lend;
    const { href, children, showArrow = true, className, ...others } = this.props;
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
  }
}

export { SimpleLink };
