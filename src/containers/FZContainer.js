/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import * as AppActionCreators from '../actions/actions';

// XML
import xml from '../../public/BB209.1.xml';

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
      toggleTranscriptionModeAction,
      zones,
      lineGroups,
      lines,
      stages,
      currentZones,
      zoneOptions,
      setZonesAction,
      showZoneROI,
      zoomToZones,
      diplomaticMode,
      } = this.props;
    console.log(pageObjects);
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
            toggleTranscriptionModeAction={toggleTranscriptionModeAction}
            zoneOptions={zoneOptions}
            setZonesAction={setZonesAction}
            zoomToZones={zoomToZones}
            showZoneROI={showZoneROI}
            diplomaticMode={diplomaticMode}
          />
          <div className="fz-display-container">
            <OpenSeadragonViewer
              tileSources={tileSources}
              options={{}}
              viewerId='fz-osd-image-viewer'
              overlays={currentZones.map((zone) => pointsToNumbers(zone.points))}
              zoomToZones={zoomToZones}
              showZoneROI={showZoneROI}
            />
            <FZTextView
              zones={currentZones}
              diplomaticMode={diplomaticMode}
            />
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
    zoneOptions: state.zoneOptions,
    showZoneROI: state.showZoneROI,
    zoomToZones: state.zoomToZones,
    diplomaticMode: state.diplomaticMode,
  }
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(FZContainer);
