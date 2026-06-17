import React from 'react';
import VaultPage from '../../pages/JLv2/VaultPage';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Vault extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('vault');
  };

  render() {
    return <VaultPage />;
  }
}

export default Vault;
