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
      homeButton: 'home-button',
    }
  }

  constructor(props) {
    super(props);
    this.initOpenSeadragon = this.initOpenSeadragon.bind(this);
    this.removeTileSources = this.removeTileSources.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTileSources = this.setTileSources.bind(this);
    this.removeTextOverlay = this.removeTextOverlay.bind(this);
    this.drawTextOverlay = this.drawTextOverlay.bind(this);
    this.rotateLeft = this.rotateLeft.bind(this);
    this.rotateRight = this.rotateRight.bind(this);
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
    this.openSeaDragonViewer.gestureSettingsMouse.clickToZoom = false;
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
  // add flow annotations
  rotateLeft(callback): void {
    let src = this.viewport.getRotation();
    src = (src === 0 || src === 360) ? 360 : src;
    let dst = (src - 45) <= 360 ? (src - 45) : 0;
    callback(dst);
    const animateLeft = (src, dst) => {
      let newSrc = src - 1;
      if (newSrc >= dst) {
        this.viewport.setRotation(newSrc);
        window.requestAnimationFrame(() => animateLeft(newSrc, dst));
      }
    }
    animateLeft(src, dst);
  }

  rotateRight(callback): void {
    let src = this.viewport.getRotation();
    let dst = (src + 45) <= 360 ? (src + 45) : 360;
    callback(dst);
    const animateRight = (src, dst) => {
      let newSrc = src + 1;
      if (newSrc <= dst) {
        this.viewport.setRotation(newSrc);
        window.requestAnimationFrame(() => animateRight(newSrc, dst));
      }
    }
    animateRight(src, dst);
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
        <div id="home-button" className="osd-controls-button">
             <Icon name="home" size="large"/>
        </div>
        <div id="rotate-left-button" onClick={() => this.rotateLeft((angle) => this.props.rotateCallback(angle))} className="osd-controls-button">
             <Icon name="reply" size="large"/>
        </div>
        <div id="rotate-right-button" onClick={() => this.rotateRight((angle) => this.props.rotateCallback(angle))} className="osd-controls-button">
             <Icon name="mail forward" size="large"/>
        </div>
      </div>);
  }

  componentDidUpdate(prevProps: Object, prevState: Object) {

  }

  drawTextOverlay(): void {
    let rect;
    /*if (this.bounds.length > 0) {
      const { x, y, w, h } = getBounds(this.bounds);
      rect = this.bounds[0];
    } else {
      rect = new OpenSeadragon.Rect(0, 0, 1, 1);
    }*/
    rect = new OpenSeadragon.Rect(0, 0, 1, 1);
    this.viewerOverlay.id = shortid.generate();
    this.openSeaDragonViewer.addOverlay({
      element: this.viewerOverlay,
      location: rect,
      rotationMode: OpenSeadragon.OverlayRotationMode.EXACT,
      checkResize: true,
    });
  }

  removeTextOverlay(): void {
    this.openSeaDragonViewer.removeOverlay(this.viewerOverlay.id);
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    return true;
  }

  componentDidUpdate(prevProps: Object, prevState: Object): void {
    // this.removeTextOverlay();
    const { tileSources, overlays } = this.props;
    if (tileSources.url !== prevProps.tileSources.url) {
      this.setTileSources(tileSources);
    }
    if (overlays.length !== prevProps.overlays.length) {
      this.bounds = this.props.overlays.map((overlay) => this.viewport.imageToViewportRectangle(...overlay));
    }
    this.drawTextOverlay();
  }

  render() {
    const { viewerId, showZoneROI, zoomToZones, rotateCallback, overlay } = this.props;
    console.log(this.props);
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
        <div
        ref={(ref) => this.viewerOverlay = ref }
        className="osd-viewer-overlay">
          {overlay}
        </div>
      </div>
    );
  }

}
