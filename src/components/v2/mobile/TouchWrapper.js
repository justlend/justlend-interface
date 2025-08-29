import React from 'react';
import { inject, observer } from 'mobx-react';

@inject('network')
@inject('lend')
@observer
class TouchWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showTabsBar: true
    };
  }
  touchStart = 0;
  touchEnd = 0;

  componentDidMount() {
    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchend', this.handleTouchEnd);
  }

  componentWillUnmount() {
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }

  handleTouchStart = e => {
    this.touchStart = e.changedTouches[0].clientY;
  };

  handleTouchEnd = e => {
    this.touchEnd = e.changedTouches[0].clientY;
    this.calculateSwipe();
  };

  calculateSwipe = () => {
    const { showTabsBar } = this.props.network;
    var distance = this.touchStart - this.touchEnd;
    var htmlHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
    var clientHeight = document.body.clientHeight || document.documentElement.clientHeight;
    var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
    //console.log(scrollTop + clientHeight, htmlHeight);
    //console.log(distance);
    if (Number(scrollTop + clientHeight) === Number(htmlHeight)) {
      if (!showTabsBar && distance > 10) {
        this.props.network.setData({
          showTabsBar: true
        });
      }
    } else {
      if (distance > 10) {
        //console.log('swipe down');
        this.props.network.setData({
          showTabsBar: false
        });
      } else if (Math.abs(distance) > 10) {
        this.props.network.setData({
          showTabsBar: true
        });
        //console.log('swipe up');
      }
    }
  };

  render() {
    const { showTabsBar } = this.props.network;
    return showTabsBar ? this.props.children : null;
  }
}

export default TouchWrapper;
