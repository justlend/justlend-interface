import React from 'react';

import { inject, observer } from 'mobx-react';
import VotePage from '../../components/v2/VoteV2';

@inject('network')
@observer
class Vote extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.network.setRouteName('vote');
  }

  render() {
    return <VotePage />;
  }
}

export default Vote;
