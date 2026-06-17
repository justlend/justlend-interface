import React from 'react';
import ReactDOM from 'react-dom';
import isMobile from 'ismobilejs';
import VConsole from 'vconsole';
import * as serviceWorker from './serviceWorker';
import App from './routes/index.jsx';
import 'antd/dist/antd.min.css';
import './assets/css/index.scss';
import './assets/css/common.scss';
import './assets/css/v2/common.scss';

// add dev tool for mobile web page
if (isMobile(window.navigator).any && import.meta.env.VITE_ENV === 'test') {
  const vConsole = new VConsole();
}

ReactDOM.render(<App />, document.getElementById('root'));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
