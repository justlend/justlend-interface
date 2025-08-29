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
    this.props.network.setData({ routeName: 'home' });
  };

  render() {
    return <HomePage />;
  }
}

export default Home;
