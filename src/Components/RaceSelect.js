import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class RaceSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    console.log(this.props)
    return (
      <Select
            name="Race Selection"
            placeholder={this.props.raceOptions ===undefined ? "First select an election" : "Select a race to analyze" }
            value={this.props.selectedOption}
            onChange={this.props.changeSelectedRace}
            options={this.props.raceOptions}
            clearable={false}
          />
    );
  }
}

export default RaceSelect;
