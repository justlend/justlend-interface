import React from 'react';

import { default as MarketDetailPage } from '../../components/v2/market-detail/MarketDetail';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class MarketDetailV2 extends React.Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.network.setRouteName('marketDetailV2');
  }
  render() {
    return (
      <div>
        <MarketDetailPage></MarketDetailPage>
      </div>
    );
  }
}

export default MarketDetailV2;
