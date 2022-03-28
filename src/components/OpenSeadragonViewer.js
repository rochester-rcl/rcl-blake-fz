// React
import React, { Component } from "react";
import ReactDOM from "react-dom";

// OpenSeadragon
import OpenSeadragon from "openseadragon";

// Semantic UI
import { Icon } from "semantic-ui-react";

// utils
import { getBounds, pointsToNumbers } from "../utils/data-utils";

import { minMax } from "../utils/geometry";

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
    overlay: null,
  };

  constructor(props) {
    super(props);
    this.initOpenSeadragon = this.initOpenSeadragon.bind(this);
    this.removeTileSources = this.removeTileSources.bind(this);
    this.setOptions = this.setOptions.bind(this);
    this.setTileSources = this.setTileSources.bind(this);
    this.renderOverlays = this.renderOverlays.bind(this);
    this.convertImageToViewportPoints =
      this.convertImageToViewportPoints.bind(this);
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
      this.setState({ overlay: this.openSeaDragonViewer.svgOverlay() });
      this.handleUpdateOverlays();
    });
    if (this.props.overlays) {
      this.openSeaDragonViewer.addHandler("open", () => {
        this.bounds = this.props.overlays.map((overlay) =>
          this.viewport.imageToViewportRectangle(...overlay.split(","))
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
      <div
        key="toolbar"
        className="osd-viewer-toolbar"
        id="osd-viewer-controls"
      >
        <div key="zoom-in" d="zoom-in-button" className="osd-controls-button">
          <Icon name="plus" size="large" />
        </div>
        <div
          key="zoom-out"
          id="zoom-out-button"
          className="osd-controls-button"
        >
          <Icon name="minus" size="large" />
        </div>
        <div key="home" id="home-button" className="osd-controls-button">
          <Icon name="home" size="large" />
        </div>
        <div
          key="rotate-left"
          id="rotate-left-button"
          onClick={() =>
            this.rotateLeft((angle) => this.props.rotateCallback(angle))
          }
          className="osd-controls-button"
        >
          <Icon name="reply" size="large" />
        </div>
        <div
          key="rotate-right"
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

  handleUpdateOverlays = () => {
    this.bounds = this.props.overlays.map((overlay) => {
      const pairs = overlay
        .split(" ")
        .map((val) => val.split(",").map(parseFloat));
      const x = pairs.map((p) => p[0]);
      const y = pairs.map((p) => p[1]);
      const minX = Math.min(...x);
      const minY = Math.min(...y);
      const maxX = Math.max(...x);
      const maxY = Math.max(...y);
      return this.viewport.imageToViewportRectangle(
        minX,
        minY,
        maxX - minX,
        maxY - minY
      );
    });
    if (this.props.zoomToZones) this.zoomToOverlays();
  };

  componentDidUpdate(prevProps: Object, prevState: Object) {
    if (this.props.tileSources.url !== prevProps.tileSources.url) {
      this.setTileSources(this.props.tileSources);
    }
    if (this.props.overlays.length > 0) {
      this.handleUpdateOverlays();
    } else {
      if (this.props.zoomToZones) this.viewport.goHome();
      if (this.props.showZoneROI) this.openSeaDragonViewer.clearOverlays();
    }
    if (prevProps.showZoneROI && !this.props.showZoneROI) {
      this.openSeaDragonViewer.clearOverlays();
    }
  }

  convertImageToViewportPoints(overlay) {
    const points = pointsToNumbers(overlay);
    const viewportPoints = points
      .map((point) => {
        const vp = this.viewport.imageToViewportCoordinates(...point);
        return `${vp.x},${vp.y}`;
      })
      .join(" ");
    return viewportPoints;
  }

  zoomToOverlays(): void {
    let { x, y, w, h } = getBounds(this.bounds);
    this.viewport.fitBounds(new OpenSeadragon.Rect(x, y, w, h));
  }

  renderOverlays() {
    const { overlays, showZoneROI } = this.props;
    if (!showZoneROI) {
      return null;
    }
    // TODO display on hover only
    if (overlays.length > 0 && this.state.overlay) {
      return ReactDOM.createPortal(
        overlays.map((overlay, idx) => {
          const points = overlay
            ? this.convertImageToViewportPoints(overlay)
            : null;
          const zone = this.props.zones[idx];
          const zoneName =
            (zone && zone.attributes && zone.attributes.type) || null;
          if (points) {
            const [minX] = minMax(overlay, 0);
            const [minY] = minMax(overlay, 1);
            const [x, y] = this.convertImageToViewportPoints(
              `${minX},${minY}`
            ).split(",");
            return (
              <g key={`overlay-${idx}`} className="zone-roi">
                <polygon
                  className="zone-roi-polygon"
                  key={`overylay-${idx}`}
                  points={points}
                  style={{
                    fill: "none",
                    stroke: "#E9BC47",
                    strokeWidth: 0.0025,
                  }}
                />
                {zoneName ? (
                  <text
                    className="zone-name-label"
                    fontFamily='"Lato", "Helvetica Neue", "Arial", "sans-serif"'
                    x={x}
                    y={y}
                    style={{ fontSize: "0.0015em", fill: "#E9BC47", textShadow: "3px 3px 4px #454545" }}
                  >
                    {zoneName}
                  </text>
                ) : null}
              </g>
            );
          } else {
            return null;
          }
        }),
        this.state.overlay.node()
      );
    }
  }

  render() {
    const { viewerId } = this.props;
    return (
      <div key="osd-viewwer-container" className="osd-viewer-container">
        {this.renderControls()}
        <div key="selection" ref="selectionROI" id="osd-selection-roi"></div>
        <div
          key="viewer"
          ref="openSeadragonDiv"
          className="openseadragon-viewer"
          id={viewerId}
        >
          {this.renderOverlays()}
        </div>
      </div>
    );
  }
}
