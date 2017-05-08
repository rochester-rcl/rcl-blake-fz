/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Dropdown, Label } from 'semantic-ui-react';

export default class FilterDropdown extends Component {
  state = { filterOptions: [], };
  constructor(props: Object) {
    super(props);
    (this :any).handleFilterChange = this.handleFilterChange.bind(this);
  }
  handleFilterChange(event: Object, { value }: Array<string>): void {
    let updatedState = {};
    updatedState[this.props.filterKey] = value;
    this.setState({ filterOptions: value });
    this.props.updateFilterParams(updatedState);
  }
  render() {
    const { options, placeholderText, label, populatedValues } = this.props;
    let placeholderValues;
    if (!populatedValues) {
      placeholderValues = [];
    } else {
      placeholderValues = populatedValues;
    }
    console.log('placeholder', placeholderValues);
    return(
      <div className="itf-filter-dropdown-container">
        <h4 className="itf-filter-dropdown-label">{label}</h4>
        <Dropdown
          className="itf-filter-dropdown"
          options={options}
          placeholder={placeholderText}
          search
          selection
          fluid
          multiple
          scrolling
          onChange={this.handleFilterChange}
          value={this.state.filterOptions.length > 0 ? this.state.filterOptions : placeholderValues}
        />
      </div>
    );
  }
}
