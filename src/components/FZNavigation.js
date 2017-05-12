/* @flow */

// React
import React, { Component } from 'react';

// semantic ui
import { Button, Radio } from 'semantic-ui-react';

// Dropdown
import FilterDropdown from './FilterDropdown';


export default class FZNavigation extends Component {
    constructor(props: Object) {
      super(props);
      (this :any).handleToggleZoneROI = this.handleToggleZoneROI.bind(this);
      (this :any).handleToggleZoomToZones = this.handleToggleZoomToZones.bind(this);
      (this :any).handleGoToPage = this.handleGoToPage.bind(this);
      (this :any).handleToggleTranscriptionMode = this.handleToggleTranscriptionMode.bind(this);
    }

    handleToggleZoneROI(): void {
      let status;
      if (!this.props.showZoneROI) {
        status = true;
      } else {
        status = false;
      }
      this.props.toggleZoneROIAction(status);
    }

    handleToggleZoomToZones (): void {
      let status;
      if (!this.props.zoomToZones) {
        status = true;
      } else {
        status = false;
      }
      this.props.toggleZoomToZoneAction(status);
    }

    handleGoToPage(pageNo: Number): void {
      this.refs.zoneFilterDropdown.clearSelection();
      this.props.goToPageAction(pageNo);
    }

    handleToggleTranscriptionMode(event: typeof SyntheticEvent, data: Object): void {
      this.props.toggleTranscriptionModeAction(data.checked);
    }

    render() {
      const {
        currentPage,
        currentPageDisplay,
        maxPages,
        goToPageAction,
        setZonesAction,
        toggleZoneROIAction,
        toggleZoomToZoneAction,
        zoneOptions,
        showZoneROI,
        zoomToZones,
        diplomaticMode,
      } = this.props;

      let controls = [
        {
          className: 'fz-main-menu-button',
          displayIcon: 'chevron left',
          displayName: '',
          id: 'fz-page-left',
          onClick: () => this.handleGoToPage(currentPage - 1),
          disabled: currentPage === 0,
        },
        {
          className: 'fz-main-menu-button',
          displayIcon: 'chevron right',
          displayName: '',
          id: 'fz-page-left',
          onClick: () => this.handleGoToPage(currentPage + 1),
          disabled: currentPage === maxPages - 1,
        },
        {
          className: showZoneROI ? 'fz-main-menu-button active' : 'fz-main-menu-button',
          displayIcon: 'eye',
          displayName: 'Toggle Zone ROI',
          id: 'fz-toggle-zone-roi',
          onClick: () => this.handleToggleZoneROI(),
          disabled: false,
        },
        {
          className: zoomToZones ? 'fz-main-menu-button active' : 'fz-main-menu-button',
          displayIcon: 'magnify',
          displayName: 'Zoom to Zone',
          id: 'fz-zoom-to-zone',
          onClick: () => this.handleToggleZoomToZones(),
          disabled: false,
        },
      ];
      console.log('diplomatic', diplomaticMode);
      return(
        <div className='fz-main-menu'>
          {controls.map((menuItem, index) =>
            <Button
              className={menuItem.className}
              key={index}
              color='grey'
              icon={ menuItem.displayIcon }
              onClick={ menuItem.onClick }
              content={menuItem.displayName}
              disabled={menuItem.disabled}
            />
          )}
          <Button
            className='fz-main-menu-button'
            key={'current_page'}
            content={'Page ' + currentPageDisplay + ' of ' + maxPages}
            disabled={true}
          />
          <FilterDropdown
            className='fz-zone-select-dropdown'
            placeholderText='Zones'
            options={zoneOptions}
            filterKey='currentZones'
            ref='zoneFilterDropdown'
            updateFilterParams={setZonesAction}
          />
          <Radio
            className="fz-toggle-transcription-mode-button"
            toggle
            checked={ diplomaticMode }
            label={ diplomaticMode ? 'Diplomatic Transcription' : 'Genetic Transcription' }
            onChange={this.handleToggleTranscriptionMode}
          />
        </div>
      );
    }
}
