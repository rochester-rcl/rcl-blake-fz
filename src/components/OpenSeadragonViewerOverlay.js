// React
import React, { Component } from "react";

// OpenSeadragon
import OpenSeadragon from "openseadragon";

// Semantic UI
import { Icon } from "semantic-ui-react";

import lodash from "lodash";

// shortid
import shortid from "shortid";

// utils
import { getBounds, pointsToNumbers } from "../utils/data-utils";

// Components
import { FZZoneView } from "./FZTextViewSvg";

const ZONE_MAP = {
  left: 0,
  body: 1,
  head: 2,
  foot: 3,
  right: 4
};

export default class OpenSeadragonViewer extends Component {
  state = {
    defaultOptions: {
      defaultZoomLevel: 0.8,
      maxZoomPixelRatio: 2,
      showReferenceStrip: false,
      showNavigator: false,
      showNavigationControl: true,
      zoomInButton: "zoom-in-button",
      zoomOutButton: "zoom-out-button",
      homeButton: "home-button"
    },
    zoom: 0
  };

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
    this.updateDynamicFontInfo = this.updateDynamicFontInfo.bind(this);
    this.fitFont = this.fitFont.bind(this);
    this.setZoneRefs = this.setZoneRefs.bind(this);
    this.renderZone = this.renderZone.bind(this);
    this.updateZoneRefs = this.updateZoneRefs.bind(this);
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
    // this.openSeaDragonViewer.zoomPerScroll = 1;
    // this.openSeaDragonViewer.addHandler('zoom', this.handleZoom);
    this.openSeaDragonViewer.gestureSettingsMouse.clickToZoom = false;
    this.viewport = this.openSeaDragonViewer.viewport;
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler("open", () => {
        this.bounds = this.props.overlays.map(overlay =>
          this.viewport.imageToViewportRectangle(...overlay)
        );
        if (this.showZoneROI) this.drawOverlays(this.bounds);
        if (this.zoomToZones) this.zoomToBounds(this.bounds);
      });
    }
    this.setState({
      zoom: this.viewport.getZoom(true)
    });
  }

  setOptions(options) {
    let defaultOptionsCopy = { ...this.state.defaultOptions };
    Object.keys(options).forEach(optionKey => {
      defaultOptionsCopy[optionKey] = options[optionKey];
    });
    return defaultOptionsCopy;
  }

  findCustomButton(buttonOptionKey) {
    this.props.customButtons.find(button => button);
  }

  bindCustomControlActions() {
    this.props.customControlActions.map(control => {
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
    src = src === 0 || src === 360 ? 360 : src;
    let dst = src - 45 <= 360 ? src - 45 : 0;
    callback(dst);
    const animateLeft = (src, dst) => {
      let newSrc = src - 1;
      if (newSrc >= dst) {
        this.viewport.setRotation(newSrc);
        window.requestAnimationFrame(() => animateLeft(newSrc, dst));
      }
    };
    animateLeft(src, dst);
  }

  rotateRight(callback): void {
    let src = this.viewport.getRotation();
    let dst = src + 45 <= 360 ? src + 45 : 360;
    callback(dst);
    const animateRight = (src, dst) => {
      let newSrc = src + 1;
      if (newSrc <= dst) {
        this.viewport.setRotation(newSrc);
        window.requestAnimationFrame(() => animateRight(newSrc, dst));
      }
    };
    animateRight(src, dst);
  }

  renderControls() {
    return (
      <div className="osd-viewer-toolbar" id="osd-viewer-controls">
        <div id="zoom-in-button" className="osd-controls-button">
          <Icon name="plus" size="large" />
        </div>
        <div id="zoom-out-button" className="osd-controls-button">
          <Icon name="minus" size="large" />
        </div>
        <div id="home-button" className="osd-controls-button">
          <Icon name="home" size="large" />
        </div>
        <div
          id="rotate-left-button"
          onClick={() =>
            this.rotateLeft(angle => this.props.rotateCallback(angle))
          }
          className="osd-controls-button"
        >
          <Icon name="reply" size="large" />
        </div>
        <div
          id="rotate-right-button"
          onClick={() =>
            this.rotateRight(angle => this.props.rotateCallback(angle))
          }
          className="osd-controls-button"
        >
          <Icon name="mail forward" size="large" />
        </div>
      </div>
    );
  }

  drawTextOverlay(): void {
    this.openSeaDragonViewer.addOverlay({
      element: this.viewerOverlay,
      location: new OpenSeadragon.Rect(0, 0, 1, 1),
      rotationMode: OpenSeadragon.OverlayRotationMode.EXACT
    });
    this.fitFont(1.0);
  }

  setZoneRefs(ref, key) {
    this.zoneRefs[key] = ref;
  }

  updateZoneRefs() {
    for (let key in this.zoneRefs) {
      let val = this.zoneRefs[key];
      if (val === null) {
        delete this.zoneRefs[key];
      }
    }
  }

  updateDynamicFontInfo() {}

  fitFont(zoom: Number) {
    /*const { parentRef } = this.props;
    const { offsetWidth } = this.viewerOverlay;
    const viewportWidth = document.body.offsetWidth;
    for (let key in this.zoneRefs) {
      const elem = this.zoneRefs[key].zoneRef;
      elem.style.fontSize = (offsetWidth / viewportWidth) * 1.5 + "vw";
    }*/

    // this.viewerOverlay.style.fontSize = (offsetWidth / viewportWidth) + 'vw';
    /*for (let key in this.zoneRefs) {
      const elem = this.zoneRefs[key].zoneRef;
      const { offsetWidth } = elem;
      const lines = elem.getElementsByClassName('fz-text-display-line');
      let widest;
      let widestElement;
      // find the longest line
      for (let line of lines) {
        let width = line.firstChild.offsetWidth;
        if (widest === undefined) {
          widest = width;
          widestElement = line.firstChild;
        } else {
          if (width > widest) {
            widest = width;
            widestElement = line.firstChild;
          }
        }
      }
      let fontSize = parseInt(elem.style.fontSize.split('px')[0], 10);
      if (widest > offsetWidth) {
        while(widestElement.offsetWidth > offsetWidth) {
          fontSize--
          elem.style.fontSize = (fontSize * zoom) + 'px';
        }
      } else {
        while(widestElement.offsetWidth < offsetWidth) {
          fontSize++
          elem.style.fontSize = (fontSize * zoom) + 'px';
        }
      }
    }*/
  }

  handleZoom(zoomInfo: Object): void {
    const { zoom, refPoint } = zoomInfo;
    this.fitFont(zoom);
    this.openSeaDragonViewer.viewport.zoomTo(zoom, refPoint);
  }

  removeTextOverlay(): void {
    this.openSeaDragonViewer.removeOverlay(this.viewerOverlay.id);
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    const { zones } = this.props;
    const { zoom } = this.state;
    if (!lodash.isEqual(zones, nextProps.zones)) return true;
    if (zoom !== nextState.zoom) return true;
    return false;
  }

  componentDidUpdate(prevProps: Object, prevState: Object): void {
    // this.removeTextOverlay();
    const { tileSources, overlays, parentRef } = this.props;
    if (tileSources.url !== prevProps.tileSources.url) {
      this.setTileSources(tileSources);
    }
    if (overlays.length !== prevProps.overlays.length) {
      this.bounds = this.props.overlays.map(overlay =>
        this.viewport.imageToViewportRectangle(...overlay)
      );
    }
    this.updateZoneRefs();
    // this.openSeaDragonViewer.clearOverlays();
    this.drawTextOverlay();
    // add listeners to parent
    if (parentRef !== null && prevProps.parentRef == null) {
      this.addListenersToParent();
    }
  }

  addListenersToParent() {
    const { parentRef } = this.props;
    if (parentRef !== null) {
      const parent = parentRef.openSeaDragonViewer;
      parent.addHandler("zoom", this.handleZoom);
    }
  }

  renderZone(zone: Object, index: Number): FZZoneView {
    const { lockRotation, diplomaticMode } = this.props;
    const { points } = zone;
    const roi = pointsToNumbers(points);
    const rect = this.viewport.imageToViewportRectangle(...roi);
    const pixels = this.viewport.viewportToViewerElementRectangle(rect);
    const zoneStyle = {
      position: "absolute",
      left: Math.floor(rect.x * 100).toString() + "%",
      top: Math.floor(rect.y * 100).toString() + "%",
      width: Math.floor(rect.width * 100).toString() + "%",
      height: Math.floor(rect.height * 100).toString() + "%",
      fontSize: "12px"
    };
    return (
      <FZZoneView
        style={zoneStyle}
        key={index}
        ref={ref => this.setZoneRefs(ref, zone.type)}
        lockRotation={lockRotation}
        diplomaticMode={diplomaticMode}
        zone={zone}
      />
    );
  }

  render() {
    const {
      viewerId,
      showZoneROI,
      zoomToZones,
      rotateCallback,
      zones,
      diplomaticMode,
      displayAngle,
      lockRotation
    } = this.props;
    let sortedZones = zones.sort((zoneA, zoneB) => {
      let zoneTypeA = zoneA.type;
      let zoneTypeB = zoneB.type;
      if (ZONE_MAP[zoneTypeA] < ZONE_MAP[zoneTypeB]) return -1;
      if (ZONE_MAP[zoneTypeA] > ZONE_MAP[zoneTypeB]) return 1;
      return 0;
    });
    let rotate =
      lockRotation === true
        ? { transform: "rotate(" + displayAngle + "deg)" }
        : {};
    let baseClass = "fz-text-display ";
    return (
      <div className="osd-viewer-container">
        <div ref="selectionROI" id="osd-selection-roi"></div>
        <div
          ref="openSeadragonDiv"
          className="openseadragon-viewer"
          id={viewerId}
        >
          {this.props.children}
        </div>
        <div
          ref={ref => (this.viewerOverlay = ref)}
          className="osd-viewer-overlay"
        >
          <div className="fz-text-view">
            <svg viewBox="0 0 100 100" className={baseClass} style={rotate}>
              {sortedZones.map(this.renderZone)}
            </svg>
          </div>
        </div>
      </div>
    );
  }
}
