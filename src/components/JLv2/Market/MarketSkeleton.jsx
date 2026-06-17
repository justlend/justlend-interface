import React from 'react';
import Store from '../../../stores';
import 'antd/dist/antd.dark.css';

import { Skeleton, Card, Row, Col, Space } from 'antd';

const ChartSkeleton = () => {
  const { lend } = Store;
  const { theme } = lend;
  const isWhite = theme === 'white';
  const bars = Array.from({ length: 30 }, (_, i) => (
    <div
      key={i}
      style={{
        width: '2.5%', 
        margin: '0 0.4%',
        height: `${Math.random() * 80 + 20}px`, 
        backgroundColor: 'rgba(255, 255, 255, 0.08)', 
        borderRadius: 2, 
        overflow: 'hidden', 
        position: 'relative' 
      }}
    >
      {}
      <Skeleton.Input
        active
        style={{
          width: '100%',
          height: '100%',
          
          border: 'none',
          background: isWhite
            ? 'linear-gradient(90deg, transparent, rgba(190, 190, 190, 0.1), transparent) #f5f5f5'
            : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent) #303030', 
          animation: 'ant-skeleton-loading 1.4s ease infinite', 
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  ));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        width: '100%',
        height: 120, 
        marginTop: 16,
        
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        padding: '0 8px', 
        borderRadius: 4
      }}
    >
      {bars}
    </div>
  );
};

const MarketSkeleton = () => {
  const { lend } = Store;
  const { theme } = lend;
  const isWhite = theme === 'white';
  const cardStyle = {
    borderRadius: '15px',
    background: 'rgba(255, 255, 255, 0.06)'
  };

  return (
    <div
      className="market-skeleton"
      style={{
        background: isWhite ? '#fff' : '#101010',
        padding: 24,
        minHeight: '100vh',
        borderRadius: 15
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={24}>
          <Card bordered={false} style={cardStyle}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} lg={18}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {}

            {}
            <Card bordered={false} style={cardStyle}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
            {}
            <Card bordered={false} style={cardStyle}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <ChartSkeleton />
            </Card>
            {}
            <Card bordered={false} style={cardStyle}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
            {}
            <Card bordered={false} style={cardStyle}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={6}>
          <Card bordered={false} style={cardStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row justify="space-around">
                <Col span={11}>
                  <Skeleton.Button active block />
                </Col>
                <Col span={11}>
                  <Skeleton.Button active block />
                </Col>
              </Row>

              <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 24 }} />

              <Skeleton.Button active block size="large" style={{ marginTop: 24, height: 36, width: 200 }} />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MarketSkeleton;
