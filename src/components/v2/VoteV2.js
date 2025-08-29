import { inject, observer } from 'mobx-react';
import React from 'react';
import Footer from './Footer';
import Header from './Header';
import SeasonToolBar from './season/index';
import Vote from './vote/index';
import WinterTheme from '../WinterTheme';
import { Config } from '../../config';
import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@observer
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  // componentDidMount = async () => { };

  render() {
    const { theme } = this.props.lend;

    return (
      <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
        {/* <Header instantActions={this.getMarketData} mountedActions={this.getMarketData} /> */}
        {Config.winterThemeVisible && <WinterTheme fromPage="vote" />}
        <Header />
        <SeasonToolBar pageName="vote" />
        <div className="j-container j-home">
          <Vote />
        </div>
        <Footer />
      </div>
    );
  }
}

export default Home;
