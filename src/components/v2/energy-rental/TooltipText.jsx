import { Tooltip } from 'antd';
import React from 'react';
import { isMobile } from '../../../utils/helper';
import '../../../assets/css/v2/energy-rental/tooltip-text.scss';

class TooltipText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTooltipShow: false
    };
  }

  onClickBody = () => {
    if (!this.state.isTooltipShow) {
      return;
    }
    this.setState({
      isTooltipShow: false
    });
    if (this.props.setIsActive) {
      this.props.setIsActive(false);
    }
  };
  componentDidMount() {
    document.body.addEventListener('click', this.onClickBody, { capture: false });
  }
  componentWillUnmount() {
    document.body.removeEventListener('click', this.onClickBody);
  }
  onClick = e => {
    e.stopPropagation();
    if (this.state.isTooltipShow) {
      return;
    }

    this.props.onOpen && this.props.onOpen();
    this.setState({
      isTooltipShow: true
    });
    if (this.props.setIsActive) {
      this.props.setIsActive(true);
    }
  };
  render() {
    const mobile = isMobile().any;
    const { isTooltipShow } = this.state;
    const { children, ...props } = this.props;
    return (
      <>
        {!mobile ? (
          children
        ) : (
          <Tooltip {...props} visible={isTooltipShow} onClick={this.onClick}>
            <div className={`tooltip-text ${isTooltipShow ? 'active' : ''}`}>{children}</div>
          </Tooltip>
        )}
      </>
    );
  }
}

export { TooltipText };
