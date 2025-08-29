import React from 'react';
import EnergyRentPage from '../../components/v2/strx/EnergyRent';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class EnergyRent extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('EnergyRent');
  };

  render() {
    return <EnergyRentPage />;
  }
}

export default EnergyRent;
