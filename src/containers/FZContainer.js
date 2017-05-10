/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import * as AppActionCreators from '../actions/actions';

// XML
import xml from '../../fz-pages/BB209.1.xml'

// Components
import LoaderModal from '../components/LoaderModal';
import FZNavigation from '../components/FZNavigation';
import OpenSeadragonViewer from '../components/OpenSeadragonViewer';
import FZTextView from '../components/FZTextView';

// Semantic UI
import { Divider } from 'semantic-ui-react';

// utils
import { pointsToNumbers } from '../utils/data-utils';

class FZContainer extends Component {
  componentDidMount() {
    // Call this here to load initial data
    this.props.loadXMLAction(xml);
  }
  render() {
    const {
      pageObjects,
      bad,
      currentPage,
      goToPageAction,
      toggleZoneROIAction,
      toggleZoomToZoneAction,
      zones,
      lineGroups,
      lines,
      stages,
      currentZones,
      zoneOptions,
      setZonesAction,
      } = this.props;
  
    if (pageObjects) {
      let tileSources = {
        type: 'image',
        url: window.location.href + '/' + currentPage.imageURL,
        crossOriginPolicy: 'Anonymous',
        ajaxWithCredentials: false
      }

      return (
        <div className="fz-app-container">
          <FZNavigation
            currentPageDisplay={currentPage.pageDisplayNo}
            currentPage={currentPage.pageNo}
            maxPages={pageObjects.length}
            goToPageAction={goToPageAction}
            toggleZoneROIAction={toggleZoneROIAction}
            toggleZoomToZoneAction={toggleZoomToZoneAction}
            zoneOptions={zoneOptions}
            setZonesAction={setZonesAction}
          />
          <div className="fz-display-container">
            <OpenSeadragonViewer
              tileSources={tileSources}
              options={{}}
              viewerId='fz-osd-image-viewer'
              overlays={currentZones.map((zone) => pointsToNumbers(zone.points))}
              zoomToZones={true}
            />
            <FZTextView />
          </div>
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
    currentPage: state.currentPage,
    zones: state.zones,
    currentZones: state.currentZones,
    zoneOptions: state.currentPage.id ? state.currentPage.surface.zone.map((zone) =>
                                      { return { text: zone.type, value: zone.id } }) :
                                      null,
  }
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(FZContainer);
