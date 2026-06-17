import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/common-m-v2.scss';
import '../../../assets/css/v2/theme-m-v2.scss';
import '../../../assets/css/v2/home-m-v2.scss';
import HomeAccount from './HomeAccount';
import HomeUserList from './HomeUserList/';
import HomeMarketList from './HomeMarketList.jsx';
import HomeMarket from '../HomeMarket';
import Footer from '../Footer';
import TabsBar from './TabsBar';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@observer
class MobileHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount() {}

  render() {
    const { routeName } = this.props.network;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    return (
      <div>
        <HomeAccount />
        <HomeUserList />
        <HomeMarket />
        <Footer></Footer>
        <TabsBar theme={theme} />
      </div>
    );
  }
}

export default MobileHome;
