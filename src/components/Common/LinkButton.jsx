import { inject, observer } from 'mobx-react';
import React from 'react';
import '../../assets/css/v2/components/link-button.scss';

@inject('lend')
@observer
class LinkButton extends React.Component {
  render() {
    const { lang } = this.props.lend;
    const { href, children, showArrow = true, className, ...others } = this.props;
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
  }
}

export { LinkButton };
