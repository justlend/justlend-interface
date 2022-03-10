import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';

const ToggleSwitchDiv = styled.div`
  position: relative;
  width: 54px;
  height: 27px;
  border-radius: 11px;
  cursor: pointer;
  display: inline-block;
  // background-color: #4f565b;
  -webkit-transition: background-color 0.2s ease-in-out;
  transition: background-color 0.2s ease-in-out;
  line-height: 1;
  font-size: 14px;
  margin-top: 3px;
`;

const ToggleOn = styled.div`
  background-color: #3d56d6;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
  padding: 0 3px;
`;
const CircleWhiteSpan = styled.span`
  width: 22px;
  height: ${props => (props.lang === 'en-US' ? '60%' : '80%')};
  border-radius: 50%;
  background: #fff;
`;
const TextTip = styled.span`
  color: #fff;
  margin: 0 7px;
  font-size: 12px;
`;

const ToggleOff = styled.div`
  background-color: #4f565b;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px;
  color: #bababa;
  padding: 0 3px;
`;

class ToggleSwitch extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  onClick = e => {
    e.stopPropagation();
    this.props.onClick && this.props.onClick();
  };

  render() {
    const { on = false, lang = 'en-US' } = this.props;
    return (
      <ToggleSwitchDiv onClick={this.onClick}>
        {on ? (
          <ToggleOn>
            <TextTip>{intl.get('index.my_y')}</TextTip>
            <CircleWhiteSpan lang={lang}></CircleWhiteSpan>
          </ToggleOn>
        ) : (
          <ToggleOff>
            <CircleWhiteSpan></CircleWhiteSpan>
            <TextTip>{intl.get('index.my_n')}</TextTip>
          </ToggleOff>
        )}
      </ToggleSwitchDiv>
    );
  }
}

export default ToggleSwitch;
