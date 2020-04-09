// React
import React, { Component } from "react";
import ReactDOM from "react-dom";

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
    overlayPoints: {},
  };

  constructor(props) {
    super(props);
    this.initOpenSeadragon = this.initOpenSeadragon.bind(this);
    this.removeTileSources = this.removeTileSources.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTileSources = this.setTileSources.bind(this);
    this.renderOverlays = this.renderOverlays.bind(this);
    this.updateOverlays= this.updateOverlays.bind(this);
    this.convertImageToViewportPoints = this.convertImageToViewportPoints.bind(
      this
    );
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
      if (this.props.zoomToZones) this.zoomToOverlays();
      this.updateOverlays();
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

  updateOverlays() {
    const { overlays } = this.props;
    const { overlayPoints } = this.state;
    overlays.forEach((overlay) => {
      if (!overlayPoints[overlay]) {
        const points = {};
        points[overlay] = this.convertImageToViewportPoints(overlay);
        this.setState({
          overlayPoints: { ...overlayPoints, ...points },
        });
      }
    });
  }

  zoomToOverlays(): void {
    let { x, y, w, h } = getBounds(this.bounds);
    this.viewport.fitBounds(new OpenSeadragon.Rect(x, y, w, h));
  }

  renderOverlays() {
    const { overlays } = this.props;
    const { overlayPoints } = this.state;
    if (overlays.length > 0) {
      return ReactDOM.createPortal(
        overlays.map((overlay) => {
          const points = overlayPoints[overlay];
          if (points) {
            return (
              <polygon
                points={points}
                style={{ fill: "none", stroke: "black", strokeWidth: 0.005 }}
              />
            );
          } else {
            return null;
          }
        }),
        this.overlay.node()
      );
    }
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
          {this.renderOverlays()}
        </div>
      </div>
    );
  }
}
