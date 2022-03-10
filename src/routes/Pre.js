import React from 'react';
import isMobile from 'ismobilejs';

import PrePage from '../components/Pre';
import { inject, observer } from 'mobx-react';

@inject('network')
@observer
class Pre extends React.Component {
  componentDidMount() {
    this.props.network.setData({ routeName: 'pre' });
  }
  render() {
    return (
      <div>
        <PrePage></PrePage>
      </div>
    );
  }
}

export default Pre;
