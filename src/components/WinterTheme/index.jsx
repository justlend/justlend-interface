import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import Config from '../../config';
import { inject, observer } from 'mobx-react';
import '../../assets/css/winterTheme.scss';
@inject('network')
@inject('system')
@inject('lend')
@observer
class Vote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = async () => {};

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  render() {
    return (
      <div className={'winter-theme ' + this.props.fromPage}>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>v<div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
        <div class="snow"></div>
      </div>
    );
  }
}

export default Vote;
