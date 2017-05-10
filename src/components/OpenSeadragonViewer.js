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
      minZoomImageRatio: 0.3,
      defaultZoomLevel: 0.8,
      maxZoomPixelRatio: 5,
      animationTime: 5,
      blendTime: 0.5,
      constrainDuringPan: true,
      springStiffness: 4,
      visibilityRatio: 0.5,
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
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler('open', () => {
        this.drawOverlays(this.props.overlays);
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
    console.log('overlays', this.props.overlays, nextProps.overlays);
    if (!lodash.isEqual(this.props.tileSources, nextProps.tileSources)) this.setTileSources(nextProps.tileSources);
    if (!lodash.isEqual(this.props.overlays, nextProps.overlays)) this.drawOverlays(nextProps.overlays);
  }

  drawOverlays(overlays: Array<Object>): void {
    this.openSeaDragonViewer.clearOverlays();
    let viewport = this.openSeaDragonViewer.viewport;
    let bounds = [];
    overlays.forEach((points) => {
      let overlay = document.createElement('div');
      overlay.id = shortid.generate();
      overlay.className = 'fz-osd-overlay';
      overlay.style.border = '2px solid #E9BC47';
      let rect = viewport.imageToViewportRectangle(...points);
      this.openSeaDragonViewer.addOverlay({
        element: overlay,
        location: rect,
      });
      bounds.push(rect);
    });
    let { x, y, w, h } = getBounds(bounds);
    console.log(x, y, w, h);
    /*this.bounds = new OpenSeadragon.Point(x, y);
    let avgX = bounds.reduce((x1, x2) => x1 + x2.x, 0) / bounds.length;
    let avgY = bounds.reduce((y1, y2) => y1 + y2.y, 0) / bounds.length;
    this.bounds = new OpenSeadragon.Point(avgX, avgY);*/
    if (this.props.zoomToZones) {
      viewport.fitBounds(new OpenSeadragon.Rect(x,y,w,h));
    }
  }

  render() {
    const { viewerId } = this.props;
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
