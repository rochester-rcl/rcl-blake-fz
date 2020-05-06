/* @flow */

// React
import React, { Component } from "react";

// Redux
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

// Actions
import * as AppActionCreators from "../actions/actions";

// Components
import LoaderModal from "../components/LoaderModal";
import FZNavigation from "../components/FZNavigation";
import OpenSeadragonViewer from "../components/OpenSeadragonViewer";
import OpenSeadragonViewerOverlay from "../components/OpenSeadragonViewerOverlay";
import FZTextView from "../components/FZTextView";

// Semantic UI
import { Divider } from "semantic-ui-react";

// utils
import { pointsToNumbers, pointsToViewportPercent } from "../utils/data-utils";
import createBackground from "../utils/image";

const xml = "/BB749.1.ms.xml";

const getImageDimensions = (url) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.addEventListener("load", () => {
      resolve([image.width, image.height]);
    });
  });
};

const background = {
  type: "image",
  url: createBackground("#1e1e1e" /*'#ccc'*/, [100, 100]),
  crossOriginPolicy: "Anonymous",
  ajaxWithCredentials: false,
};

class FZContainer extends Component {
  state = {
    textDisplayAngle: 0,
    background: background,
  };
  constructor(props: Object) {
    super(props);
    this.updateTextDisplayAngle = this.updateTextDisplayAngle.bind(this);
    this.openseadragonViewerRef = null;
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

  componentDidUpdate(prevProps) {
    const { currentPage } = this.props;
    if (currentPage && prevProps.currentPage) {
      if (currentPage.id !== prevProps.currentPage.id) {
        if (currentPage.imageURL) {
          getImageDimensions(
            window.location.href + "/" + currentPage.imageURL
          ).then((dim) => {
            this.setState({
              background: {
                ...this.state.background,
                url: createBackground("#1e1e1e", dim),
              },
            });
          });
        }
      }
    }
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
        type: "image",
        url: window.location.href + "/" + currentPage.imageURL,
        crossOriginPolicy: "Anonymous",
        ajaxWithCredentials: false,
      };
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
              ref={(ref) => (this.openseadragonViewerRef = ref)}
              tileSources={tileSources}
              options={{}}
              viewerId="fz-osd-image-viewer"
              overlays={currentZones.map((zone) => zone.points)}
              zoomToZones={zoomToZones}
              showZoneROI={showZoneROI}
              rotateCallback={this.updateTextDisplayAngle}
            />
            <OpenSeadragonViewerOverlay
              tileSources={this.state.background}
              options={{}}
              viewerId="fz-osd-image-overlay-viewer"
              overlays={currentZones.map((zone) => zone.points)}
              zoomToZones={zoomToZones}
              showZoneROI={showZoneROI}
              parentRef={this.openseadragonViewerRef}
              rotateCallback={this.updateTextDisplayAngle}
              zones={currentZones}
              diplomaticMode={diplomaticMode}
              displayAngle={textDisplayAngle}
              lockRotation={lockRotation}
            />
          </div>
        </div>
      );
    } else {
      return (
        <LoaderModal
          active={true}
          text="Loading XML"
          className="fz-loading-screen"
        />
      );
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
  };
}

function mapActionCreatorsToProps(dispatch: Object) {
  return bindActionCreators(AppActionCreators, dispatch);
}

export default connect(mapStateToProps, mapActionCreatorsToProps)(FZContainer);
