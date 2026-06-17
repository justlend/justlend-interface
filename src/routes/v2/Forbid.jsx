import React from 'react';
import { ForbidPage } from '../../components/v2/forbid-page';
import { inject, observer } from 'mobx-react';

@inject('network')
@inject('lend')
@observer
class Forbid extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.network.setRouteName('Forbid');
  };

  render() {
    const { theme } = this.props.lend;

    return <ForbidPage theme={theme} />;
  }
}

export default Forbid;
