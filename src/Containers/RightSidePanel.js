import React, { Component } from 'react';

class RightSidePanel extends Component {
  render() {
    return (
      <div className="rightSidePanel">
        {this.props.children}
      </div>
    );
  }
}

export default RightSidePanel;
