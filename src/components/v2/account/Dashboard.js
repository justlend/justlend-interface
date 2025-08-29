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
    barMaxWidth: 10, //圆环宽度
    radiusAxis: {
      //隐藏坐标
      show: false,
      type: 'category'
    },
    polar: {
      //设置圆环位置和大小
      center: ['50%', '50%'],
      radius: mobile ? '138' : ' 144'
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            //上层圆环，用于显示真实数据
            value: props.num,
            itemStyle: {
              color: {
                //图形渐变颜色方法，四个数字分别代表，右，下，左，上，offset表示0%到100%
                // type: 'linear',
                // x: 0,
                // y: 0,
                // x2: 1, //从左到右 0-1
                // y2: 0,
                // colorStops: props.colorStops,
                // globalCoord: true // 缺省为 false
                // 纹理填充
                image: document.getElementById('outerCircle'), // 支持为 HTMLImageElement, HTMLCanvasElement，不支持路径字符串
                repeat: 'repeat' // 是否平铺，可以是 'repeat-x', 'repeat-y', 'no-repeat'
              }
            }
          }
        ],
        barGap: '-100%', //柱间距离,用来将上下两层圆环重合
        coordinateSystem: 'polar', //类型，极坐标
        // roundCap: true, //顶端圆角
        itemStyle: {
          borderRadius: [111, 111, 111, 111]
        },
        z: 3 //圆环层级，和zindex相似
      },
      {
        //下层圆环，用于显示最大值
        type: 'bar',
        data: [
          {
            value: max,
            itemStyle: {
              // color: !props.isWhite ? '#424351' : 'rgba(34, 35, 43, 0.1)',
              color: {
                image: document.getElementById('outerCircleDefault')
              }
              // shadowColor: 'rgba(0, 0, 0, 0.2)', //加白色阴影产生高亮效果
              // shadowBlur: 5,
              // shadowOffsetY: 2
            }
          }
        ],
        itemStyle: {
          borderRadius: [111, 111, 111, 111]
        },
        barGap: '-100%', //柱间距离,用来将上下两层圆环重合
        coordinateSystem: 'polar', //类型，极坐标
        // roundCap: true, //顶端圆角

        z: 2 //圆环层级，和zindex相似
      },
      {
        //下层圆环，用于显示最大值
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
        barGap: '-100%', //柱间距离,用来将上下两层圆环重合
        coordinateSystem: 'polar', //类型，极坐标
        // roundCap: true, //顶端圆角

        z: 1 //圆环层级，和zindex相似
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
    //更新数据
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
