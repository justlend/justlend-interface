import React from 'react';
import LiquidationPage from '../../pages/JLv2/LiquidationPage';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Liquidation extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('liquidationV2');
  };

  render() {
    return <LiquidationPage />;
  }
}

export default Liquidation;
