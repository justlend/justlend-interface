import React from 'react';

import { Spin } from 'antd';
import HomePage from '../../components/v2/Home';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('homev1');
    window.localStorage.setItem('CURRENT_VERSION', 'v1');
  };

  render() {
    return <HomePage />;
  }
}

export default Home;
