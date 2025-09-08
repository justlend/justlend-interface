import React from 'react';
import intl from 'react-intl-universal';
import LiquidatePage from '../../components/v2/liquidate/';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Liquidate extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setData({ routeName: 'liquidate' });
    window.gtag('event', 'liquidate_list_PV', { 'event_category': 'liquidate', 'event_label': 'liquidate_list_PV' });
    window.gtag('event', 'liquidate_list_UV', { 'event_category': 'liquidate', 'event_label': 'liquidate_list_UV' });
  };

  render() {
    return <LiquidatePage />;
  }
}

export default Liquidate;
