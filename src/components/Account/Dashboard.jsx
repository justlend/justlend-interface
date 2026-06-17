import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react/lib';
import isMobile from 'ismobilejs';
import OuterCircle from '../../assets/images/v2/account/outer-circle.svg';
import OuterCircleDefault from '../../assets/images/v2/account/outer-circle-default.svg';
import OuterCircleMobile from '../../assets/images/v2/account/outer-circle-m.svg';
import OuterCircleMobileDefault from '../../assets/images/v2/account/outer-circle-m-default.svg';
import OuterCircleWhite from '../../assets/images/v2/white-theme/account/outer-circle.svg';
import OuterCircleWhiteDefault from '../../assets/images/v2/white-theme/account/outer-circle-default.svg';
import OuterCircleWhiteMobile from '../../assets/images/v2/white-theme/account/outer-circle-m.svg';
import OuterCircleWhiteMobileDefault from '../../assets/images/v2/white-theme/account/outer-circle-m-default.svg';

const Dashboard = props => {
  let option, max;
  max = 100;
  const [mobile, setMobile] = useState(isMobile(window.navigator).any);
  const echartRef = useRef(null);

  useEffect(() => {
    if (echartRef?.current) {
      const echartInstance = echartRef.current?.getEchartsInstance();
      echartInstance.setOption(option);
    }
  }, [option, props.num, props.isWhite]);

  option = {
    angleAxis: props.angleAxis,
    barMaxWidth: 10,
    radiusAxis: {
      show: false,
      type: 'category'
    },
    polar: {
      center: ['50%', '50%'],
      radius: mobile ? '138' : ' 144'
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            value: props.num,
            itemStyle: {
              color: {
                image: document.getElementById('outerCircle'),
                repeat: 'repeat'
              }
            }
          }
        ],
        barGap: '-100%',
        coordinateSystem: 'polar',
        itemStyle: {
          borderRadius: [111, 111, 111, 111]
        },
        z: 3
      },
      {
        type: 'bar',
        data: [
          {
            value: max,
            itemStyle: {
              color: {
                image: document.getElementById('outerCircleDefault')
              }
            }
          }
        ],
        itemStyle: {
          borderRadius: [111, 111, 111, 111]
        },
        barGap: '-100%',
        coordinateSystem: 'polar',
        z: 2
      },
      {
        type: 'bar',
        data: [
          {
            value: max,
            itemStyle: {
              color: 'transparent'
            }
          }
        ],
        itemStyle: {
          borderRadius: [111, 111, 111, 111]
        },
        barGap: '-100%',
        coordinateSystem: 'polar',
        z: 1
      }
    ]
  };

  const width = mobile ? 148 : 154;
  const height = mobile ? 148 : 154;

  return (
    <>
      {option && (
        <ReactECharts
          className="account-dashboard"
          ref={echartRef}
          option={option}
          style={{ width, height }}
          notMerge={true}
        />
      )}
      {mobile ? (
        <>
          <img alt="" src={props.isWhite ? OuterCircleWhiteMobile : OuterCircleMobile} id="outerCircle" />
          <img
            alt=""
            src={props.isWhite ? OuterCircleWhiteMobileDefault : OuterCircleMobileDefault}
            id="outerCircleDefault"
          />
        </>
      ) : (
        <>
          <img alt="" src={props.isWhite ? OuterCircleWhite : OuterCircle} id="outerCircle" />
          <img alt="" src={props.isWhite ? OuterCircleWhiteDefault : OuterCircleDefault} id="outerCircleDefault" />
        </>
      )}
    </>
  );
};

export default Dashboard;
