import React from 'react';
import MarketPage from '../../pages/JLv2/MarketPage';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Market extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('marketV2');
  };

  render() {
    return <MarketPage />;
  }
}

export default Market;
