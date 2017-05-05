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
    const { pageObjects, bad } = this.props;
    console.log(bad);
    console.log(pageObjects);
    if (pageObjects) {
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
    bad: state.bad,
    pageObjects: state.pageObjects,
  }
}

export default connect(mapStateToProps)(FZContainer);
