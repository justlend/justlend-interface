import React from 'react';
import LiquidityStakePage from '../../components/v2/strx/LiquidityStake';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class LiquidityStake extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('LiquidityStake');
  };

  render() {
    return <LiquidityStakePage />;
  }
}

export default LiquidityStake;
