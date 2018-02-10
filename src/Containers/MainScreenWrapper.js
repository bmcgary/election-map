import React, { Component } from 'react';

class MainScreenWrapper extends Component {
  render() {
    return (
      <div className="mainScreenWrapper">
        {this.props.children}
      </div>
    );
  }
}

export default MainScreenWrapper;
