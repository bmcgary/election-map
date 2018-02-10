import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class RaceSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <Select
            name="Race Selection"
            value={this.props.selectedOption}
            onChange={this.props.changeSelectedRace}
            options={this.props.raceOptions}
            clearable={false}
          />
    );
  }
}

export default RaceSelect;
