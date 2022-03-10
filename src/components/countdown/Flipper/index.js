import React from 'react';
import './style.scss';

class Flipper extends React.PureComponent {
  constructor(props) {
    super(props);

    /**
     * @type {object}
     * @property {object} toggle - flag for switching index of current digit index
     */
    this.state = { toggle: false };
  }

  /**
   * Inverse state.toggle flag
   */
  tick() {
    this.setState({ toggle: !this.state.toggle });
  }

  /**
   * Returns next/prev value of digits linked list
   * @param {number} current - currently active value
   * @param {string} direction - list move direction
   * @return {number} linked list value
   */
  getCount(current, direction) {
    let isRev = this.props.reverse,
      isNext = direction == 'next',
      head = this.props[isRev ? 'min' : 'max'],
      tail = this.props[isRev ? 'max' : 'min'];

    return isNext
      ? current == head
        ? tail
        : current + (isRev ? -1 : 1)
      : current == tail
      ? head
      : current + (isRev ? 1 : -1);
  }

  /**
   * Execute flip action in 'props.now' value has been changed
   * @param {object} newProps - next props object
   */
  componentWillReceiveProps(newProps) {
    newProps.now !== this.props.now && this.tick();
  }

  /**
   * Generate semi linked list structure with siblings of active number
   * Index of active number depends of 'state.toggle' flag
   * @param {object} newProps - next props object
   * @return {array} linked list slice
   */
  getRange(initial) {
    let prev = this.getCount(initial, 'prev'),
      arr = [initial, prev, this.getCount(prev, 'prev')];

    arr[!this.state.toggle ? 'unshift' : 'push'](
      !this.state.toggle ? this.getCount(initial, 'next') : this.getCount(prev, 'prev')
    );

    return arr;
  }

  /**
   * Render card sets for number
   * @return {ReactElement} markup
   */
  render() {
    return (
      <div className="cards">
        {this.getRange(this.props.now).map((val, i) => {
          return (
            <div key={`flip-card${i}`} className={`card${val == this.props.now ? ' now' : ''}`}>
              <div className="sides">
                {['front', 'back'].map(key => (
                  <div key={`side${key}`} className={`side ${key}`}>
                    <div className="side-num">{key == 'front' ? val : this.getCount(val, 'next')}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default Flipper;
