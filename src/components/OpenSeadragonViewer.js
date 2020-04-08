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

import initSvgOverlay from "../utils/osd-svg-overlay";

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
      homeButton: "home-button",
    },
    overlayRefs: {},
  };

  constructor(props) {
    super(props);
    this.initOpenSeadragon = this.initOpenSeadragon.bind(this);
    this.removeTileSources = this.removeTileSources.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTileSources = this.setTileSources.bind(this);
    this.renderOverlays = this.renderOverlays.bind(this);
    this.updateOverlayRefs = this.updateOverlayRefs.bind(this);
    this.convertImageToViewportPoints = this.convertImageToViewportPoints.bind(
      this
    );
    this.drawOverlays = this.drawOverlays.bind(this);
    this.zoomToOverlays = this.zoomToOverlays.bind(this);
    this.rotateLeft = this.rotateLeft.bind(this);
    this.rotateRight = this.rotateRight.bind(this);
    this.bounds = [];
  }

  componentDidMount() {
    this.initOpenSeadragon();
  }

  initOpenSeadragon() {
    initSvgOverlay(OpenSeadragon);
    const { tileSources, viewerId, options } = this.props;
    options.id = viewerId;
    options.tileSources = tileSources;
    const combinedOptions = this.setOptions(options);
    this.openSeaDragonViewer = OpenSeadragon(combinedOptions);
    this.viewport = this.openSeaDragonViewer.viewport;
    this.openSeaDragonViewer.addHandler("tile-loaded", () => {
      this.overlay = this.openSeaDragonViewer.svgOverlay();
    });
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler("open", () => {
        this.bounds = this.props.overlays.map((overlay) =>
          this.viewport.imageToViewportRectangle(...overlay)
        );
        if (this.showZoneROI) this.drawOverlays(this.bounds);
        if (this.zoomToZones) this.zoomToBounds(this.bounds);
      });
    }
  }

  setOptions(options) {
    let defaultOptionsCopy = { ...this.state.defaultOptions };
    Object.keys(options).forEach((optionKey) => {
      defaultOptionsCopy[optionKey] = options[optionKey];
    });
    return defaultOptionsCopy;
  }

  findCustomButton(buttonOptionKey) {
    this.props.customButtons.find((button) => button);
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
            this.rotateLeft((angle) => this.props.rotateCallback(angle))
          }
          className="osd-controls-button"
        >
          <Icon name="reply" size="large" />
        </div>
        <div
          id="rotate-right-button"
          onClick={() =>
            this.rotateRight((angle) => this.props.rotateCallback(angle))
          }
          className="osd-controls-button"
        >
          <Icon name="mail forward" size="large" />
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps: Object, prevState: Object) {
    if (this.props.tileSources.url !== prevProps.tileSources.url) {
      this.setTileSources(this.props.tileSources);
    }
    if (this.props.overlays.length > 0) {
      /*this.bounds = this.props.overlays.map((overlay) =>
        this.viewport.imageToViewportRectangle(...overlay)
      );*/
      if (this.props.showZoneROI) this.drawOverlays();
      if (this.props.zoomToZones) this.zoomToOverlays();
      this.updateOverlayRefs();
    } else {
      if (this.props.zoomToZones) this.viewport.goHome();
      if (this.props.showZoneROI) this.openSeaDragonViewer.clearOverlays();
    }
    if (prevProps.showZoneROI && !this.props.showZoneROI)
      this.openSeaDragonViewer.clearOverlays();
  }

  convertImageToViewportPoints(overlay) {
    const points = pointsToNumbers(overlay);
    // TODO memoize this
    const viewportPoints = points
      .map((point) => {
        const vp = this.viewport.imageToViewportCoordinates(...point);
        return `${vp.x},${vp.y}`;
      })
      .join(" ");
    return viewportPoints;
  }

  updateOverlayRefs() {
    const { overlays } = this.props;
    const { overlayRefs } = this.state;
    overlays.forEach((overlay) => {
      if (!overlayRefs[overlay]) {
        const ref = {};
        ref[overlay] =  {
          ref: React.createRef(),
          points: this.convertImageToViewportPoints(overlay),
        }
        this.setState({
          overlayRefs: { ...this.state.overlayRefs, ...ref },
        });
      }
    });
  }

  zoomToOverlays(): void {
    let { x, y, w, h } = getBounds(this.bounds);
    this.viewport.fitBounds(new OpenSeadragon.Rect(x, y, w, h));
  }

  drawOverlays(): void {
    // this.openSeaDragonViewer.clearOverlays();
    // create the svgs here
    /*this.bounds.forEach((rect) => {
      let overlay = document.createElement("div");
      overlay.id = shortid.generate();
      overlay.className = "fz-osd-overlay";
      overlay.style.outline = "2px solid #E9BC47";
      this.openSeaDragonViewer.addOverlay({
        element: overlay,
        location: rect,
        rotationMode: OpenSeadragon.OverlayRotationMode.EXACT,
      });
    });*/
    const { overlayRefs } = this.state;
    for (const key in overlayRefs) {
      const { ref } = overlayRefs[key];
      if (ref.current) {
        this.overlay.node().appendChild(ref.current.cloneNode(true));
      }
    }
  }

  renderOverlays() {
    const { overlays } = this.props;
    const { overlayRefs } = this.state;
    if (overlays.length > 0) {
      return overlays.map((overlay) => {
        const id = overlay;
        const _overlay = overlayRefs[id];
        if (_overlay) {
          const { ref, points } = _overlay;
          return (
            <polygon
              ref={ref}
              points={points}
              style={{ fill: "none", stroke: "black", strokeWidth: 0.005 }}
            />
          );
        } else {
          return null;
        }
      });
    }
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    /*if (nextProps.tileSources.url !== this.props.tileSources.url) return true;
    if (this.props.overlays.length !== nextProps.overlays.length) return true;
    if (!lodash.isEqual(nextState.overlayRefs, this.state.overlayRefs))
      return true;
    return false;*/
    return true;
  }

  render() {
    const { viewerId, showZoneROI, zoomToZones, rotateCallback } = this.props;
    return (
      <div className="osd-viewer-container">
        {this.renderControls()}
        <div ref="selectionROI" id="osd-selection-roi"></div>
        <div
          ref="openSeadragonDiv"
          className="openseadragon-viewer"
          id={viewerId}
        >
          {this.props.children}
          <svg style={{ display: "none" }}>{this.renderOverlays()}</svg>
        </div>
      </div>
    );
  }
}
