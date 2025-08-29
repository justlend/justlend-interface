import React from 'react';
import MarketPage from '../../components/v2/Market';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Market extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setData({ routeName: 'market' });
  };

  render() {
    return <MarketPage />;
  }
}

export default Market;
