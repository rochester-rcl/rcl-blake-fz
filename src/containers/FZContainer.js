/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';

// XML
import xml from '../../fz-pages/BB209.1.xml'

// Components
import LoaderModal from '../components/LoaderModal';

class FZContainer extends Component {
  componentDidMount() {
    // Call this here to load initial data
    this.props.loadXMLAction(xml);
  }
  render() {
    const { xml2json } = this.props;
    if (xml2json) {
      return (
        <div className="fz-container">
          <h4>Hi</h4>
        </div>
      );
    } else {
      return (
        <LoaderModal
          active={true}
          text='Loading XML'
          className='fz-loading-screen'
        />
      )
    }
  }
}

function mapStateToProps(state) {
  return {
    xml2json: state.xml2json,
  }
}

export default connect(mapStateToProps)(FZContainer);
