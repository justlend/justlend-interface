import React from 'react';
import intl from 'react-intl-universal';
import ApplicationPage from '../../components/v2/Application';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Application extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('application');
  };

  render() {
    return <ApplicationPage />;
  }
}

export default Application;
