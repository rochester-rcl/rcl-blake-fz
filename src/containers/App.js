/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import * as AppActionCreators from '../actions/actions';

// Containers
import FZContainer from './FZContainer';

class App extends Component {
  render() {
    return (
      <div className="app-root-container">
        <FZContainer />
      </div>
    );
  }
}

function mapStateToProps(state) {
  // Do sorting here
  return {
  }
}

export default connect(mapStateToProps)(App);
