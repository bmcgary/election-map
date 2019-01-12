import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class ElectionSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <Select
            name="Election Selection"
            placeholder="Select an election to analyze"
            value={this.props.selectedOption}
            onChange={this.props.changeSelectedElection}
            options={this.props.electionOptions}
            clearable={false}
          />
    );
  }
}

export default ElectionSelect;
