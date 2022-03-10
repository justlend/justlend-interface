import React from 'react';

import { Spin } from 'antd';
import HomePage from '../components/Home';
import Pre from '../components/Pre';
import Config from '../config';
import { inject, observer } from 'mobx-react';
import { getTimeNow } from '../utils/backend';

@inject('network')
@observer
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  getNowTime = async () => {
    try {
      let start = this.props.network.start;
      const res = await getTimeNow();
      if (res.success) {
        const nowTime = res.time;
        if (nowTime < Config.startTime) {
          start = false;
        } else if (nowTime >= Config.startTime) {
          start = true;
        }
        this.props.network.setData({ start, nowTime });

        if (start) return;
      }
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    } catch (error) {
      console.log('get time error', error);
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    }
  };

  getCountTime = async () => {
    if (this.props.network.start) {
      return;
    }
    if (this.props.network.nowTime === null) {
      await this.getNowTime();
    } else {
      this.props.network.setData({
        nowTime: this.props.network.nowTime + 1000
      });
      let { nowTime, start } = this.props.network;

      if (nowTime < Config.startTime) {
        start = false;
      } else if (nowTime >= Config.startTime) {
        start = true;
      }

      this.props.network.setData({ start });
    }
    setTimeout(async () => {
      this.getCountTime();
    }, 1000);
  };

  componentDidMount = async () => {
    this.props.network.setData({ routeName: 'home' });
  };

  render() {
    return <HomePage />;
  }
}

export default Home;
