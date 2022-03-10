import React from 'react';

import MarketPage from '../components/Market';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Market extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'market' });
  }
  render() {
    return (
      <div>
        <MarketPage></MarketPage>
      </div>
    );
  }
}

export default Market;
