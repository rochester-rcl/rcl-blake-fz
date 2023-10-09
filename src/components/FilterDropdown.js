/* @flow */

// React
import React, { Component } from "react";

// Semantic UI
import { Dropdown, Icon, Transition } from "semantic-ui-react";

export default class FilterDropdown extends Component {
  state = { filterOptions: [] };

  constructor(props) {
    super(props);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
  }

  componentDidMount() {
    this.resetFilter();
  }

  resetFilter = () => {
    const { options, filterKey, updateFilterParams } = this.props;
    // all zones by default
    let updatedState = {};
    let allZones = options.map((opt) => opt.value);
    updatedState[filterKey] = allZones;
    this.setState({ filterOptions: allZones });
    updateFilterParams(updatedState);
  }

  handleFilterChange(event, { value }) {
    let updatedState = {};
    updatedState[this.props.filterKey] = value;
    this.setState({ filterOptions: value });
    this.props.updateFilterParams(updatedState);
  }

  clearSelection() {
    this.setState({ filterOptions: [] });
  }

  handleDropdownToggle = () => {
    const { showDropdown } = this.state;
    this.setState({ showDropdown: !showDropdown });
  };

  render() {
    const { options, placeholderText, label, populatedValues, show } =
      this.props;
    let placeholderValues;
    if (!populatedValues) {
      placeholderValues = [];
    } else {
      placeholderValues = populatedValues;
    }
    return (
      <div className="fz-filter-dropdown-container">
        <Transition.Group>
          {show ? (
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
              value={
                this.state.filterOptions.length > 0
                  ? this.state.filterOptions
                  : placeholderValues
              }
            />
          ) : null}
        </Transition.Group>
      </div>
    );
  }
}
