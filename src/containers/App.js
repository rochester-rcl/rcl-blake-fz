/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import * as AppActionCreators from '../actions/actions';

// Semantic UI
import { Icon } from 'semantic-ui-react';

// CSS
import 'semantic-ui-css/semantic.css';

// XML
import xml from '../../fz-pages/BB209.1.xml'

class App extends Component {
  componentDidMount() {
    // Call this here to load initial data
    this.props.loadXMLAction(xml);
  }
  render() {
    const { xml2json } = this.props;
    console.log(xml2json);
    return (
      <div className="app-root-container">
        <h4>Hi</h4>
      </div>
    );
  }
}

function mapStateToProps(state) {
  // Do sorting here
  return {
    xml2json: state.xml2json,
  }
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(App);
