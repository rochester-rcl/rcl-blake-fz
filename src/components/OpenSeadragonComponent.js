// React
import React, {Component} from 'react';

// OpenSeadragon
import OpenSeadragon from 'openseadragon';

// classnames
const classNames = require('classnames');

// Semantic UI
import { Icon, Input } from 'semantic-ui-react';

export default class OpenSeadragonViewer extends Component {
  state: Object = {
    defaultOptions: {
      minZoomImageRatio: 0.3,
      defaultZoomLevel: 0.8,
      maxZoomPixelRatio: 5,
      animationTime: 2.5,
      blendTime: 0.5,
      constrainDuringPan: true,
      springStiffness: 6,
      visibilityRatio: 0.5,
      showReferenceStrip: false,
      showNavigator:  false,
      showNavigationControl: true,
      showControls: true,
      toolbar: 'osd-viewer-controls',
      zoomInButton: 'zoom-in-button',
      zoomOutButton: 'zoom-out-button',
    }
  }

  constructor(props: Object) {
    super(props);
    (this: any).initOpenSeadragon = this.initOpenSeadragon.bind(this);
    (this: any).removeTileSources = this.removeTileSources.bind(this);
    (this: any).setOptions = this.setOptions.bind(this);
    (this: any).setTileSources = this.setTileSources.bind(this);
    (this: any).renderCustomControls = this.renderCustomControls.bind(this);
    (this: any).regions = [];
  }

  componentDidMount(): void {
    this.initOpenSeadragon();
  }

  initOpenSeadragon(): void {
    const { tileSources, viewerId, options } = this.props;
    options.id = viewerId;
    options.tileSources = tileSources;
    const combinedOptions = this.setOptions(options);
    this.openSeaDragonViewer = OpenSeadragon(combinedOptions);
  }

  setOptions(options: Object): Object {
    let defaultOptionsCopy = {...this.state.defaultOptions};
    Object.keys(options).forEach((optionKey) => {
      defaultOptionsCopy[optionKey] = options[optionKey];
    });
    return defaultOptionsCopy;
  }

  findCustomButton(buttonOptionKey) {
    this.props.customButtons.find((button) => button)
  }

  bindCustomControlActions(): void {
    this.props.customControlActions.map((control) => {
      this.openSeaDragonViewer.addControl(control);
    });
  }

  removeTileSources(): void {
    this.openSeaDragonViewer.world.resetItems();
  }

  setTileSources(tileSources: Object): void {
    this.openSeaDragonViewer.open(tileSources);
  }

  renderCustomControls(): void {
    if (!this.props.customControls) {
      return(
        <div className="osd-viewer-toolbar" id="osd-viewer-controls">
          <div id="zoom-in-button" className="osd-controls-button">
              <Icon name="plus" size="large"/>
          </div>
          <div id="zoom-out-button" className="osd-controls-button">
              <Icon name="minus" size="large"/>
          </div>
        </div>
      )
    }
  }

  render() {
    const { viewerId } = this.props;
    return (
      <div className="osd-viewer-container">
        {this.renderCustomControls()}
        <div
          ref="openSeadragonDiv"
          className="openseadragon-viewer"
          id={viewerId}>
        </div>
      </div>
    );
  }

}
