import React from 'react';

import VotePage from '../components/Vote';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Vote extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'vote' });
  }
  render() {
    return (
      <div>
        <VotePage></VotePage>
      </div>
    );
  }
}

export default Vote;
