import React from 'react';
import EnergyRentalPage from '../../components/v2/energy-rental/EnergyRental';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class EnergyRental extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setData({ routeName: 'EnergyRent' });
  };

  render() {
    return <EnergyRentalPage />;
  }
}

export default EnergyRental;
