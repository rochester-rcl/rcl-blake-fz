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
import { computeScanlineFill, minMax } from "../utils/geometry";
// Components
import { FZZoneView } from "./FZTextViewSvg";
import { FormatLine, Background, FormatTextFoot } from "./SvgTextFormat";
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
    overlay: null,
    textRefsReady: false,
    textNeedsRerender: false,
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
    this.getTextPath = this.getTextPath.bind(this);
    this.getFontSize = this.getFontSize.bind(this);
    this.getZoneFontSize = this.getZoneFontSize.bind(this);
    this.convertImageToViewportPoints =
      this.convertImageToViewportPoints.bind(this);
    this.setTextRefs = this.setTextRefs.bind(this);
    this.bounds = [];
    this.textRefs = {};
    this.svgRef = null;
  }

  componentDidMount() {
    this.initOpenSeadragon();
  }

  arePointsNormalized(points) {
    const coords = points
      .split(" ")
      .map((coord) => coord.split(",").map((n) => parseFloat(n)))
      .reduce((a, b) => a.concat(b));
    return coords.every((coord) => Math.round((coord * 10)) / 10 <= 1.0);
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
    this.openSeaDragonViewer.addHandler("tile-drawn", this.handleDrawTile);
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

  handleDrawTile = () => {
    if (!this.state.textRefsReady) {
      this.setState({ overlay: this.openSeaDragonViewer.svgOverlay() });
    } else {
      this.openSeaDragonViewer.removeHandler("tile-drawn", this.handleDrawTile);
    }
  };

  convertImageToViewportPoints(overlay, stringVal = true) {
    const points = pointsToNumbers(overlay);
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
    const refs = Object.values(this.textRefs);
    if (!this.state.textRefsReady && refs.every((ref) => ref !== null)) {
      this.setState({ textRefsReady: true });
    }
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
    if (this.props.overlays.length === 0) {
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

  getFontSize(textRef, width) {
    if (!textRef) {
      return null;
    }
    let tw = textRef.getComputedTextLength();
    let wScale = width / tw;
    let fs = tw / textRef.textContent.length;
    return fs * wScale;
  }

  getTextPath(points, zone, roi) {
    const { drawBackgrounds } = this.state;
    const nLines = zone.lg.reduce((a, b) => a + b.l.length, 0);
    const [fill, lineHeight] = computeScanlineFill(points, nLines, 100);
    let vspace = zone.lg[0].vspace && Array.isArray(zone.lg[0].vspace) ? zone.lg[0].vspace : [zone.lg[0].vspace];
    let l = [...zone.lg[0].l]
    // add vspace to lines
    for (let v of vspace) {
      if (v && v.vspace && v.vspace.parentIndex !== undefined) {
        let idx = v.vspace.parentIndex;

        // add line height to points
        let extent = v.vspace.extent || 0;
        if (extent) {
          // push all subsequent lines down
          let offset = parseInt(extent * lineHeight, 10);
          let fillIdx = idx;
          for (let i = fillIdx; i < fill.length; i++) {
            let fillPoints = fill[i];
            // add vspace to fill points
            let p = pointsToNumbers(fillPoints);
            fill[i] = `${p[0][0]},${p[0][1] + offset} ${p[1][0]},${p[1][1] + offset}}`;
          }
        }
      }
    }

    const viewportPoints = fill.map((l) =>
      this.convertImageToViewportPoints(l, false)
    );

    const defaultFontSize = this.viewport.imageToViewportCoordinates(80, 80).x;

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

    return viewportPoints.map((p, idx) => {
      const id = shortid.generate();
      const line = l[idx];
      const [p1, p2] = p;
      const textRefId = `${zone.id}-${idx}`;
      const textRef = this.textRefs[textRefId];

      if (p1.x > p2.x) {
        p.reverse();
      }
      return l ? (
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
            fontFamily='"Lato", "Helvetica Neue", "Arial", "sans-serif"'
            ref={(ref) => this.setTextRefs(ref, textRefId)}
            style={{
              fontSize: `${defaultFontSize}px`,
              fill: "#ccc"
            }}
          >
            <textPath href={`#text-path-line-${id}`}>
              <FormatLine line={line} textRef={textRef} zoneRoi={roi} textLength={(p2.x - p1.x) + 100} />
            </textPath>
          </text>
        </g>
      ) : null;
    });
  }

  getZoneFontSize(points, zone) {
    let [minX, maxX] = minMax(points, 0);
    let w = this.viewport.imageToViewportCoordinates(Math.abs(maxX - minX), 0).x;
    let fontSizes = zone.lg[0].l.map((l, idx) => {
      let textRef = this.textRefs[`${zone.id}-${idx}`];
      return this.getFontSize(textRef, w);
    });
    let sorted = fontSizes.sort((a, b) => a - b);
    return sorted[sorted.length / 2];
  }

  renderOverlays() {
    const { overlays } = this.props;
    const child = (
      <g>
        <SvgFilters />
        <g>
          {overlays.map((overlay, index) => {
            const points = this.convertImageToViewportPoints(overlay);
            if (points && this.arePointsNormalized(points)) {
              // render zone in overlay
              let pointsNum = points
                .split(" ")
                .map((coord) => coord.split(",").map((n) => parseFloat(n)));
              return (
                <g key={`overlay-${index}`}>
                  {this.getTextPath(
                    overlay,
                    this.props.zones[index],
                    pointsNum
                  )}
                </g>
              );
            } else {
              return null;
            }
          })}
        </g>
      </g>
    );
    if (overlays.length > 0 && this.state.overlay) {
      return ReactDOM.createPortal(child, this.state.overlay.node());
    }
  }

  render() {
    const { viewerId, zones, displayAngle, lockRotation } = this.props;
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
      <div className="osd-viewer-container overlay">
        <div ref="selectionROI" id="osd-selection-roi"></div>
        <div
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
