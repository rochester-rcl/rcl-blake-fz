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
import { getBounds, pointsToNumbers } from '../utils/data-utils';

// Components
import { FZZoneView } from './FZTextView';

const ZONE_MAP = {
  left: 0,
  body: 1,
  head: 2,
  foot: 3,
  right: 4,
}

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
    },
    zoom: 0,
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
    this.handleZoom = this.handleZoom.bind(this);
    this.setZoneRefs = this.setZoneRefs.bind(this);
    this.renderZone = this.renderZone.bind(this);
    this.bounds = [];
    this.zoneRefs = {};
  }

  componentDidMount() {
    this.initOpenSeadragon();
  }

  initOpenSeadragon() {
    const { tileSources, viewerId, options } = this.props;
    this.fontBase = 20;
    this.lineHeightBase = this.viewerOverlay.style.lineHeight = 0.8;
    options.id = viewerId;
    options.tileSources = tileSources;
    const combinedOptions = this.setOptions(options);
    this.openSeaDragonViewer = OpenSeadragon(combinedOptions);
    this.openSeaDragonViewer.addHandler('zoom', this.handleZoom);
    this.openSeaDragonViewer.gestureSettingsMouse.clickToZoom = false;
    this.viewport = this.openSeaDragonViewer.viewport;
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler('open', () => {
        this.bounds = this.props.overlays.map((overlay) => this.viewport.imageToViewportRectangle(...overlay));
        if (this.showZoneROI) this.drawOverlays(this.bounds);
        if (this.zoomToZones) this.zoomToBounds(this.bounds);
      });
    }
    this.setState({
      zoom: this.viewport.getZoom(true)
    });
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

  drawTextOverlay(): void {
    for (let key in this.zoneRefs) {
      let zone = this.zoneRefs[key];
      let elem = zone.zoneRef;
      let { points } = zone.props.zone;
      let roi = pointsToNumbers(points);
      let rect;
      if (roi.length > 0) {
        rect = this.viewport.imageToViewportRectangle(...roi);
      } else {
        rect = new OpenSeadragon.Rect(0, 0, 1, 1);
      }
      elem.id = shortid.generate();
      this.openSeaDragonViewer.addOverlay({
        element: elem,
        location: rect,
        rotationMode: OpenSeadragon.OverlayRotationMode.EXACT,
        checkResize: false,
      });
    }
  }

  setZoneRefs(ref, key) {
    this.zoneRefs[key] = ref;
  }

  handleZoom(zoomInfo: Object): void {
    this.viewerOverlay.style.fontSize = Math.ceil(this.fontBase * zoomInfo.zoom).toString() + 'px';
    this.viewerOverlay.style.lineHeight = Math.ceil(this.lineHeightBase * (zoomInfo.zoom * 0.1));
  }

  removeTextOverlay(): void {
    this.openSeaDragonViewer.removeOverlay(this.viewerOverlay.id);
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    const { zones } = this.props;
    if (!lodash.isEqual(zones, nextProps.zones)) return true;
    return false;
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
    this.openSeaDragonViewer.clearOverlays();
    this.drawTextOverlay();
  }

  renderZone(zone: Object, index: Number): FZZoneView {
    const { lockRotation, diplomaticMode } = this.props;
    return (
      <FZZoneView
        key={index}
        ref={(ref) => this.setZoneRefs(ref, zone.type)}
        lockRotation={lockRotation}
        diplomaticMode={diplomaticMode}
        zone={zone}
      />
    );
  }

  render() {
    const { viewerId, showZoneROI, zoomToZones, rotateCallback, zones, diplomaticMode, displayAngle, lockRotation, } = this.props;
    let sortedZones = zones.sort((zoneA, zoneB) => {
      let zoneTypeA = zoneA.type;
      let zoneTypeB = zoneB.type;
      if (ZONE_MAP[zoneTypeA] < ZONE_MAP[zoneTypeB]) return -1;
      if (ZONE_MAP[zoneTypeA] > ZONE_MAP[zoneTypeB]) return 1;
      return 0;
    });
    let rotate = (lockRotation === true) ? { transform: 'rotate(' + displayAngle + 'deg)' } : {};
    let baseClass = "fz-text-display ";
    return (
      <div className="osd-viewer-container">
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
          <div className="fz-text-view">
            <div className={baseClass} style={rotate}>
              {sortedZones.map(this.renderZone)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
