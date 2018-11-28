/* @flow */

// React
import React, { Component } from 'react';

// Redux
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions
import * as AppActionCreators from '../actions/actions';

// Components
import LoaderModal from '../components/LoaderModal';
import FZNavigation from '../components/FZNavigation';
import OpenSeadragonViewer from '../components/OpenSeadragonViewer';
import OpenSeadragonViewerOverlay from '../components/OpenSeadragonViewerOverlay';
import FZTextView from '../components/FZTextView';

// Semantic UI
import { Divider } from 'semantic-ui-react';

// utils
import { pointsToNumbers } from '../utils/data-utils';
import createBackground from '../utils/image';

const xml =  '/BB209.1.xml';

const background = {
  type: 'image',
  url: createBackground('#1e1e1e', [2575, 3283]),
  crossOriginPolicy: 'Anonymous',
  ajaxWithCredentials: false
}

class FZContainer extends Component {
  state = {
    textDisplayAngle: 0,
  }
  constructor(props: Object) {
    super(props);
    (this: any).updateTextDisplayAngle = this.updateTextDisplayAngle.bind(this);
  }
  componentDidMount() {
    // Call this here to load initial data
    this.props.loadXMLAction(xml);
  }
  updateTextDisplayAngle(angle: number): void {
    this.setState({
      textDisplayAngle: angle,
    });
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
      toggleLockRotationAction,
      zones,
      lineGroups,
      lines,
      stages,
      currentZones,
      zoneOptions,
      setZonesAction,
      showZoneROI,
      zoomToZones,
      lockRotation,
      diplomaticMode,
      } = this.props;
    const { textDisplayAngle } = this.state;
    if (pageObjects) {
      let tileSources = {
        type: 'image',
        url: window.location.href + '/' + currentPage.imageURL,
        crossOriginPolicy: 'Anonymous',
        ajaxWithCredentials: false
      }
      const fztext = <FZTextView
        zones={currentZones}
        diplomaticMode={diplomaticMode}
        displayAngle={textDisplayAngle}
        lockRotation={lockRotation}
      />;

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
            toggleLockRotationAction={toggleLockRotationAction}
            zoneOptions={zoneOptions}
            setZonesAction={setZonesAction}
            zoomToZones={zoomToZones}
            lockRotation={lockRotation}
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
              rotateCallback={this.updateTextDisplayAngle}
            />
            <OpenSeadragonViewerOverlay
              tileSources={background}
              options={{}}
              viewerId='fz-osd-image-overlay-viewer'
              overlays={currentZones.map((zone) => pointsToNumbers(zone.points))}
              zoomToZones={zoomToZones}
              showZoneROI={showZoneROI}
              rotateCallback={this.updateTextDisplayAngle}
              overlay={fztext}
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
    lockRotation: state.lockRotation,
  }
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(FZContainer);
