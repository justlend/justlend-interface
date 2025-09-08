import { inject, observer } from 'mobx-react';
import React from 'react';
import EnergyRentOrderListPage from '../../components/v2/strx/EnergyRentOrderList';

@inject('network')
@observer
class EnergyRentOrderList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setData({ routeName: 'EnergyRentOrderList' });
  };

  render() {
    return <EnergyRentOrderListPage />;
  }
}

export default EnergyRentOrderList;
