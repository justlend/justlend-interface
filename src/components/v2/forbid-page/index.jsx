import React from 'react';
import './style.scss';
import isMobile from 'ismobilejs';

export class ForbidPage extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {}

  render() {
    const { theme } = this.props;
    const isWhite = theme === 'white';

    return (
      <div className={`forbid${isWhite ? '' : ' dark'}`}>
        <div className="content">
          <div className="icon"></div>
          {/* <div className="text-wrap">
            <div className="text en">
              Users from mainland China are not allowed to access or use the products and services. If you are a user
              from mainland China, please stop using immediately.
            </div>
          </div> */}
        </div>
      </div>
    );
  }
}
