/* @flow */

// React
import React, { Component } from 'react';

// semantic ui
import { Button } from 'semantic-ui-react';

// Dropdown
import FilterDropdown from './FilterDropdown';


const FZNavigation = (props: Object) => {
    const {
      currentPage,
      currentPageDisplay,
      maxPages,
      goToPageAction,
      toggleZoneROIAction,
      toggleZoomToZoneAction } = props;

    let controls = [
      {
        displayIcon: 'chevron left',
        displayName: '',
        id: 'fz-page-left',
        onClick: () => goToPageAction(currentPage - 1),
        disabled: currentPage === 0,
      },
      {
        displayIcon: 'chevron right',
        displayName: '',
        id: 'fz-page-left',
        onClick: () => goToPageAction(currentPage + 1),
        disabled: currentPage === maxPages - 1,
      },
      {
        displayIcon: 'eye',
        displayName: 'Toggle Zone ROI',
        id: 'fz-toggle-zone-roi',
        onClick: () => toggleZoneROIAction(),
        active: false,
        disabled: false,
      },
      {
        displayIcon: 'magnify',
        displayName: 'Zoom to Zone',
        id: 'fz-zoom-to-zone',
        onClick: () => toggleZoomToZoneAction(),
        active: false,
        disabled: false,
      },
    ];
    return(
      <div className='fz-main-menu'>
        {controls.map((menuItem, index) =>
          <Button
            className='fz-main-menu-button'
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
      </div>
    );
}

export default FZNavigation;
