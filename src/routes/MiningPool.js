import React from 'react';

import MiningPoolPage from '../components/MiningPool';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class MiningPool extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'miningPool' });
  }
  render() {
    return (
      <div>
        <MiningPoolPage></MiningPoolPage>
      </div>
    );
  }
}

export default MiningPool;
