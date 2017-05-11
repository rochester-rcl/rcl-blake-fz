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
    (this :any).clearSelection = this.clearSelection.bind(this);
  }
  handleFilterChange(event: Object, { value }: Array<string>): void {
    let updatedState = {};
    updatedState[this.props.filterKey] = value;
    this.setState({ filterOptions: value });
    this.props.updateFilterParams(updatedState);
  }
  clearSelection(): void {
    this.setState({ filterOptions: [] });
  }
  render() {
    const { options, placeholderText, label, populatedValues } = this.props;
    let placeholderValues;
    if (!populatedValues) {
      placeholderValues = [];
    } else {
      placeholderValues = populatedValues;
    }
    return(
      <div className="fz-filter-dropdown-container">
        <Dropdown
          className="fz-filter-dropdown"
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
