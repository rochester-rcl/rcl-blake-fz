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

// CSS
import 'semantic-ui-css/semantic.css';

class App extends Component {
  render() {
    const { loadXMLAction } = this.props;
    return (
      <div className="app-root-container">
        <FZContainer loadXMLAction={loadXMLAction} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  // Do sorting here
  return {
  }
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(App);
