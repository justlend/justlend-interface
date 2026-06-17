import React from 'react';
import DashboardPage from '../../pages/JLv2/DashboardPage';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('dashboard');
    window.localStorage.setItem('CURRENT_VERSION', 'v2');
  };

  render() {
    return <DashboardPage />;
  }
}

export default Dashboard;
