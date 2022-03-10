import React from 'react';

import MarketDetailPage from '../components/MarketDetail';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class MarketDetail extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'market' });
  }
  render() {
    return (
      <div>
        <MarketDetailPage></MarketDetailPage>
      </div>
    );
  }
}

export default MarketDetail;
