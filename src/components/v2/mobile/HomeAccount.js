import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { getAnnoucements } from '../../../utils/backend';
import { BigNumber, getQueryObj } from '../../../utils/helper';
import Account from '../account';

@inject('network')
@inject('lend')
@inject('pool')
@observer
class HomeAccount extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      announcementList: {}
    };
  }

  componentDidMount = async () => {
    // let lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale || 'en-US';
    let lang = 'en-US';
    let announcementList = await getAnnoucements({ perPageCount: 3, lang });
    this.setState({ announcementList: announcementList[0] });
  };

  render() {
    const { isConnected } = this.props.network;
    const {} = this.props.lend;
    const { announcementList } = this.state;

    return (
      <>
        <div className="j-subhead j-home-subhead">
          <div className="j-title">{intl.get('v2.lend_title')}</div>
          <div className="info">
            <div className="desc">{intl.get('strx.stake_home_desc')}</div>
            {Object.keys(announcementList).length > 0 && (
              <div className="j-announce">
                <span className="announce-icon"></span>
                <a
                  className="announce-content"
                  href={`${announcementList?.html_url}`}
                  target="announce"
                  rel="noreferrer"
                >
                  {announcementList.title}（{announcementList?.created_at?.substr(0, 10)}）
                </a>
                <span className="announce-arrow-icon"></span>
              </div>
            )}
          </div>
        </div>
        <div className="j-infos">
          <Account />
        </div>
      </>
    );
  }
}

export default HomeAccount;
