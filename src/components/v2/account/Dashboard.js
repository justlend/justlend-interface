import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import isMobile from 'ismobilejs';
import OuterCircle from '../../../assets/images/v2/account/outer-circle.svg';
import OuterCircleDefault from '../../../assets/images/v2/account/outer-circle-default.svg';
import OuterCircleMobile from '../../../assets/images/v2/account/outer-circle-m.svg';
import OuterCircleMobileDefault from '../../../assets/images/v2/account/outer-circle-m-default.svg';
import OuterCircleWhite from '../../../assets/images/v2/white-theme/account/outer-circle.svg';
import OuterCircleWhiteDefault from '../../../assets/images/v2/white-theme/account/outer-circle-default.svg';
import OuterCircleWhiteMobile from '../../../assets/images/v2/white-theme/account/outer-circle-m.svg';
import OuterCircleWhiteMobileDefault from '../../../assets/images/v2/white-theme/account/outer-circle-m-default.svg';

const Page: React.FC = props => {
  var option, max;
  max = 100;
  const [mobile, setMobile] = useState(isMobile(window.navigator).any);

  useEffect(() => {
    const echartInstance = echartRef.current.getEchartsInstance();
    echartInstance.clear();
    echartInstance.setOption(option);
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
                // type: 'linear',
                // x: 0,
                // y: 0,

                // y2: 0,
                // colorStops: props.colorStops,

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
              // color: !props.isWhite ? '#424351' : 'rgba(34, 35, 43, 0.1)',
              color: {
                image: document.getElementById('outerCircleDefault')
              }

              // shadowBlur: 5,
              // shadowOffsetY: 2
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

  const echartRef = useRef();

  function onChartReady(echarts) {
    // console.log('echarts is ready', echarts);
    // setTimeout(() => {
    //   setOption(20);
    // }, 3000);
  }

  function setOption(number) {
    option.series[2].data[0].value = number;
    option.series[0].data[0].value = number;

    console.log(echartRef);
    const echartInstance = echartRef.current.getEchartsInstance();
    echartInstance.setOption(option);
  }

  const width = mobile ? 148 : 154;
  const height = mobile ? 148 : 154;

  return (
    <>
      <ReactECharts
        className="account-dashboard"
        ref={echartRef}
        option={option}
        style={{ width, height }}
        onChartReady={onChartReady}
        notMerge={true}
      />
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

export default Page;
