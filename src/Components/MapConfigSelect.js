import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class MapConfigSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <Select
            name="Map Setting"
            value={this.props.selectedOption}
            onChange={this.props.changeSelectedOption}
            options={this.props.mapOptions}
            clearable={false}
          />
    );
  }
}

export default MapConfigSelect;
