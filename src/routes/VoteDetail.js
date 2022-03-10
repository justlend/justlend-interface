import React from 'react';

import VoteDetailPage from '../components/VoteDetail';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class VoteDetail extends React.Component {
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

export default VoteDetail;
