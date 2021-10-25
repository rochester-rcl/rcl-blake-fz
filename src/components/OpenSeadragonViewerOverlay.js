// React
import React, { Component, createRef } from "react";
import ReactDOM from "react-dom";

// OpenSeadragon
import OpenSeadragon from "openseadragon";
import initSvgOverlay from "../utils/osd-svg-overlay";

// Semantic UI
import { Icon } from "semantic-ui-react";

import lodash from "lodash";

// shortid
import shortid from "shortid";

// utils
import { getBounds, pointsToNumbers } from "../utils/data-utils";
import { computeScanlineFill, getLineHeight } from "../utils/geometry";
// Components
import { FZZoneView } from "./FZTextViewSvg";
import { FormatLine, Background } from "./SvgTextFormat";
import SvgFilters from "./SvgFilters";
import sleep from "../utils/sleep";
const ZONE_MAP = {
  left: 0,
  body: 1,
  head: 2,
  foot: 3,
  right: 4,
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
      homeButton: "home-button",
      drawBackgrounds: false,
    },
    overlayPoints: {},
    zoom: 0,
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
    this.handleRotate = this.handleRotate.bind(this);
    this.updateOverlays = this.updateOverlays.bind(this);
    this.convertImageToViewportPoints =
      this.convertImageToViewportPoints.bind(this);
    this.setTextRefs = this.setTextRefs.bind(this);
    this.renderZone = this.renderZone.bind(this);
    this.bounds = [];
    this.textRefs = {};
    this.svgRef = null;
  }

  componentDidMount() {
    this.initOpenSeadragon();
  }

  initOpenSeadragon() {
    initSvgOverlay(OpenSeadragon);
    const { tileSources, viewerId, options } = this.props;
    this.fontBase = 20;
    // this.lineHeightBase = this.viewerOverlay.style.lineHeight = 0.8;
    options.id = viewerId;
    options.tileSources = tileSources;
    const combinedOptions = this.setOptions(options);
    this.openSeaDragonViewer = OpenSeadragon(combinedOptions);
    // this.openSeaDragonViewer.zoomPerScroll = 1;
    // this.openSeaDragonViewer.addHandler('zoom', this.handleZoom);
    this.openSeaDragonViewer.gestureSettingsMouse.clickToZoom = false;
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
    this.setState({
      zoom: this.viewport.getZoom(true),
    });
  }

  convertImageToViewportPoints(overlay, stringVal = true) {
    const points = pointsToNumbers(overlay);
    // TODO memoize this
    let viewportPoints;
    if (stringVal) {
      viewportPoints = points
        .map((point) => {
          const vp = this.viewport.imageToViewportCoordinates(...point);
          return `${vp.x},${vp.y}`;
        })
        .join(" ");
    } else {
      viewportPoints = points
        .map((point) => {
          const vp = this.viewport.imageToViewportCoordinates(...point);
          return vp;
        })
        .reduce((a, b) => a.concat(b), []);
    }
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

  drawTextOverlay(): void {
    this.openSeaDragonViewer.addOverlay({
      element: this.viewerOverlay,
      location: new OpenSeadragon.Rect(0, 0, 1, 1),
      rotationMode: OpenSeadragon.OverlayRotationMode.EXACT,
    });
  }

  setTextRefs(ref, key) {
    this.textRefs[key] = ref;
  }

  handleZoom(zoomInfo: Object): void {
    const { zoom, refPoint } = zoomInfo;
    this.openSeaDragonViewer.viewport.zoomTo(zoom, refPoint);
  }

  handleRotate({ degrees }) {
    this.viewport.setRotation(degrees);
  }

  handlePan = (panInfo) => {
    const { center } = panInfo;
    this.openSeaDragonViewer.viewport.panTo(center);
  };

  removeTextOverlay(): void {
    this.openSeaDragonViewer.removeOverlay(this.viewerOverlay.id);
  }

  componentDidUpdate(prevProps: Object, prevState: Object): void {
    // this.removeTextOverlay();
    if (this.props.zones.length !== prevProps.zones.length) {
      // hack to make sure text is rendered before the background so we can get the correct position / size
      this.setState({ drawBackgrounds: false }, () => {
        sleep(100).then(this.setState({ drawBackgrounds: true }));
      });
    }
    if (this.props.tileSources.url !== prevProps.tileSources.url) {
      this.setTileSources(this.props.tileSources);
    }
    if (this.props.overlays.length > 0) {
      /*this.bounds = this.props.overlays.map((overlay) =>
        this.viewport.imageToViewportRectangle(...overlay)
      );*/
      this.updateOverlays();
    } else {
      if (this.props.zoomToZones) this.viewport.goHome();
      if (this.props.showZoneROI) this.openSeaDragonViewer.clearOverlays();
    }
    if (prevProps.showZoneROI && !this.props.showZoneROI)
      this.openSeaDragonViewer.clearOverlays();
    const { parentRef } = this.props;
    if (
      parentRef !== null &&
      this.props.lockRotation !== prevProps.lockRotation
    ) {
      this.addListenersToParent();
    }
  }

  addListenersToParent() {
    const { parentRef, lockRotation } = this.props;
    if (parentRef !== null) {
      const parent = parentRef.openSeaDragonViewer;
      if (lockRotation) {
        parent.addHandler("zoom", this.handleZoom);
        parent.addHandler("pan", this.handlePan);
        parent.addHandler("rotate", this.handleRotate);
      } else {
        parent.removeHandler("zoom", this.handleZoom);
        parent.removeHandler("pan", this.handlePan);
        parent.removeHandler("rotate", this.handleRotate);
      }
    }
  }

  renderZone(zone: Object, index: Number): FZZoneView {
    const { lockRotation, diplomaticMode } = this.props;
    /*const zoneStyle = {
      position: "absolute",
      fontSize: "12px"
    };
    return (
      <FZZoneView
        style={zoneStyle}
        key={zone.type}
        ref={ref => this.setZoneRefs(ref, zone.type)}
        lockRotation={lockRotation}
        diplomaticMode={diplomaticMode}
        zone={zone}
      />
    );*/
  }

  getTextPath(points, zone) {
    const { drawBackgrounds } = this.state;
    const nLines = zone.lg.reduce((a, b) => a + b.l.length, 0);
    let lineHeight = getLineHeight(points, nLines);
    lineHeight = this.viewport.imageToViewportCoordinates(0, lineHeight).y;
    const fill = computeScanlineFill(points, nLines);
    const viewportPoints = fill.map((l) =>
      this.convertImageToViewportPoints(l, false)
    );
    if (nLines === 0) {
      return viewportPoints.map((p, idx) => {
        const id = shortid.generate();
        return (
          <g key={`viewport-points-${idx}`}>
            <path
              key={id}
              id={`text-path-line-${id}`}
              d={`M${p[0].x} ${p[0].y} L${p[1].x} ${p[1].y}`}
            />
          </g>
        );
      });
    }
    const { l } = zone.lg[0];
    let lh = 0;
    // TODO need to reduce zone text
    return viewportPoints.map((p, idx) => {
      const id = shortid.generate();
      const line = l[idx];
      // TODO draw gap / erasure background rectangles before lines
      const [p1, p2] = p;
      const w = p2.x - p1.x;
      if (!lh) {
        lh = viewportPoints[idx + 1][0].y - p1.y;
      }
      const textRefId = `${zone.id}-${idx}`;
      const textRef = this.textRefs[textRefId];
      // grab glyph size from the first character for now
      return (
        <g key={`group-${idx}`}>
          <path
            key={id}
            id={`text-path-line-${id}`}
            d={`M${p[0].x} ${p[0].y} L${p[1].x} ${p[1].y}`}
          />
          {drawBackgrounds && textRef ? (
            <Background textRef={textRef} line={line} />
          ) : null}
          <text
            ref={(ref) => this.setTextRefs(ref, textRefId)}
            style={{ fontSize: "0.001em", fill: "#ccc" }}
          >
            <textPath href={`#text-path-line-${id}`}>
              <FormatLine line={line} textRef={textRef} />
            </textPath>
          </text>
        </g>
      );
    });
  }

  renderOverlays() {
    const { overlays } = this.props;
    const { overlayPoints } = this.state;
    const child = (
      <g>
        <SvgFilters />
        <g>
          {overlays.map((overlay, index) => {
            const points = overlayPoints[overlay];
            if (points) {
              // render zone in overlay
              return (
                <g key={`overlay-${index}`}>{this.getTextPath(overlay, this.props.zones[index])}</g>
              );
            } else {
              return null;
            }
          })}
        </g>
      </g>
    );
    if (overlays.length > 0) {
      return ReactDOM.createPortal(child, this.overlay.node());
    }
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
      lockRotation,
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
          {this.renderOverlays()}
        </div>
      </div>
    );
  }
}
