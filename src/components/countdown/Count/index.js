import React from 'react';
import Flipper from '../Flipper';
import './style.scss';

class Count extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      start: props.start,
      diff: {}
    };
  }

  /**
   * Create second interval
   */
  componentDidMount() {
    if (!this.isTimeOver(this.state.diff)) {
      this.interval = window.setInterval(() => {
        this.getDiffObject();
        this.isTimeOver() && this.stopCount();
      }, 1000);
    } else {
      this.stopCount();
    }
  }

  /**
   * Clears interval and drop notification
   */
  stopCount() {
    window.clearInterval(this.interval);
    this.props.onStop && this.props.onStop();
  }

  /**
   * Destroy second interval
   */
  componentWillUnmount() {
    window.clearInterval(this.interval);
  }

  /**
   * Calculate diff object between stop and current date
   * @return {Object} formatted value
   */
  getDiffObject() {
    var ms = Math.abs(this.props.end - this.state.start),
      s = Math.floor(ms / 1000),
      m = Math.floor(s / 60),
      h = Math.floor(m / 60),
      d = Math.floor(h / 24);

    const diff = {
      // days: Math.floor(h / 24),
      hours: h % 24,
      minutes: m % 60,
      seconds: s % 60
    };
    const start = this.state.start + 1000;

    this.setState({ diff, start });
    // this.setState({ diff });
  }

  /**
   * Return flag stop date reached
   * @return {Boolean}
   */
  isTimeOver() {
    return this.state.start > this.props.end;
  }

  /**
   * Returns formated to 2 digits string
   * @param {Number} data - raw value
   * @return {String} formatted value
   */
  getFormattedVal(data) {
    return (data < 10 ? '0' + data : data) + '';
  }

  /**
   * Render Flipper component for each digit of diff object vals
   * @return {ReactElement} markup
   */
  render() {
    let forks = {
        days: [
          [0, 9],
          [0, 9]
        ],
        hours: [
          [0, 2],
          [0, 4]
        ],
        minutes: [
          [0, 5],
          [0, 9]
        ],
        seconds: [
          [0, 5],
          [0, 9]
        ]
      },
      isOver = this.isTimeOver();

    return (
      <div className="countdown">
        {Object.keys(this.state.diff).map(key => (
          <div key={key} className={`countdown-${key}`}>
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <Flipper
                  key={`${key}${i}`}
                  reverse
                  now={+this.getFormattedVal(this.state.diff[key])[i]}
                  min={forks[key][i][0]}
                  max={forks[key][i][1]}
                />
              ))}
          </div>
        ))}
      </div>
    );
  }
}

export default Count;
