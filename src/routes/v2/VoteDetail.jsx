import React from 'react';

import { default as VoteDetailPage } from '../../components/v2/vote-detail/VoteDetail';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class VoteDetailV2 extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'vote' });
  }
  render() {
    return (
      <div>
        <VoteDetailPage></VoteDetailPage>
      </div>
    );
  }
}

export default VoteDetailV2;
