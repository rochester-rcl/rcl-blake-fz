// React
import React, {Component} from 'react';

// OpenSeadragon
import OpenSeadragon from 'openseadragon';

// Semantic UI
import { Icon } from 'semantic-ui-react';

import lodash from 'lodash';

// shortid
import shortid from 'shortid';

// utils
import { getBounds } from '../utils/data-utils';

export default class OpenSeadragonViewer extends Component {
  state = {
    defaultOptions: {
      defaultZoomLevel: 0.8,
      maxZoomPixelRatio: 2,
      animationTime: 2,
      blendTime: 0.5,
      constrainDuringPan: true,
      springStiffness: 1,
      visibilityRatio: 0.2,
      showReferenceStrip: false,
      showNavigator:  false,
      showNavigationControl: true,
      zoomInButton: 'zoom-in-button',
      zoomOutButton: 'zoom-out-button',
      bounds: null,
    }
  }

  constructor(props) {
    super(props);
    this.initOpenSeadragon = this.initOpenSeadragon.bind(this);
    this.removeTileSources = this.removeTileSources.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTileSources = this.setTileSources.bind(this);
    this.drawOverlays = this.drawOverlays.bind(this);
    this.zoomToOverlays = this.zoomToOverlays.bind(this);
    this.bounds = [];
  }

  componentDidMount() {
    this.initOpenSeadragon();
  }

  initOpenSeadragon() {
    const { tileSources, viewerId, options } = this.props;
    options.id = viewerId;
    options.tileSources = tileSources;
    const combinedOptions = this.setOptions(options);
    this.openSeaDragonViewer = OpenSeadragon(combinedOptions);
    this.viewport = this.openSeaDragonViewer.viewport;
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler('open', () => {
        this.bounds = this.props.overlays.map((overlay) => this.viewport.imageToViewportRectangle(...overlay));
        if (this.showZoneROI) this.drawOverlays(this.bounds);
        if (this.zoomToZones) this.zoomToBounds(this.bounds);
      });
    }
  }

  setOptions(options) {
    let defaultOptionsCopy = {...this.state.defaultOptions};
    Object.keys(options).forEach((optionKey) => {
      defaultOptionsCopy[optionKey] = options[optionKey];
    });
    return defaultOptionsCopy;
  }

  findCustomButton(buttonOptionKey) {
    this.props.customButtons.find((button) => button)
  }

  bindCustomControlActions() {
    this.props.customControlActions.map((control) => {
      this.openSeaDragonViewer.addControl(control);
    });
  }

  removeTileSources() {
    this.openSeaDragonViewer.world.resetItems();
  }

  setTileSources(tileSources) {
    this.openSeaDragonViewer.open(tileSources);
  }

  renderControls() {
    return(
      <div className="osd-viewer-toolbar" id="osd-viewer-controls">
        <div id="zoom-in-button" className="osd-controls-button">
          <Icon name="plus" size="large"/>
         </div>
        <div id="zoom-out-button" className="osd-controls-button">
             <Icon name="minus" size="large"/>
        </div>
      </div>);
  }

  componentWillReceiveProps(nextProps: Object, nextState: Object) {
    if (this.props.tileSources.url !== nextProps.tileSources.url) {
      this.setTileSources(nextProps.tileSources);
    }
    if (nextProps.overlays.length > 0) {
      this.bounds = nextProps.overlays.map((overlay) => this.viewport.imageToViewportRectangle(...overlay));
      if (nextProps.showZoneROI) this.drawOverlays();
      if (nextProps.zoomToZones) this.zoomToOverlays();
    } else {
      if (nextProps.zoomToZones) this.viewport.goHome();
    }
    if (this.props.showZoneROI && !nextProps.showZoneROI) this.openSeaDragonViewer.clearOverlays();
  }

  zoomToOverlays(): void {
    let { x, y, w, h } = getBounds(this.bounds);
    this.viewport.fitBoundsWithConstraints(new OpenSeadragon.Rect(x,y,w,h));
  }

  drawOverlays(): void {
    this.openSeaDragonViewer.clearOverlays();
    this.bounds.forEach((rect) => {
      let overlay = document.createElement('div');
      overlay.id = shortid.generate();
      overlay.className = 'fz-osd-overlay';
      overlay.style.border = '2px solid #E9BC47';
      this.openSeaDragonViewer.addOverlay({
        element: overlay,
        location: rect,
      });
    });
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    return false;
  }

  render() {
    const { viewerId, showZoneROI, zoomToZones } = this.props;
    return (
      <div className="osd-viewer-container">
        {this.renderControls()}
        <div ref="selectionROI" id="osd-selection-roi"></div>
        <div
          ref="openSeadragonDiv"
          className="openseadragon-viewer"
          id={viewerId}>
          {this.props.children}
        </div>
      </div>
    );
  }

}
