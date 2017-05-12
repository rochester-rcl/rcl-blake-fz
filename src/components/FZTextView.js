/* @flow */

// React
import React from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

const FZTextView = (props: Object) => {
  const { zones, diplomaticMode } = props;

  const FZLineGroupView = (props: Object) => {
    const { lineGroup } = props;
    return(
      <div key={lineGroup.id} className="fz-text-display-line-group">
        {lineGroup.lines.map((line) =>
          diplomaticMode ? <FZDiplomaticView key={line.id} diplomatic={line.diplomatic} /> :
          <div>Hi</div>
        )}
      </div>
    );
  }

  const FZDiplomaticView = (props: Object) => {
    const { diplomatic } = props;
    return(
      <div key={diplomatic.id} className='fz-text-display-line diplomatic'>
        {diplomatic['#text']}
      </div>
    );
  }

  const FZZoneView = (props: Object) => {
    const { zone } = props;
    return(
      <div key={zone.id} className={"fz-text-display-zone " + zone.type}>
        {zone.lineGroups.map((lineGroup) =>
          <FZLineGroupView key={lineGroup.id} lineGroup={lineGroup} />
        )}
      </div>
    );
  }


  console.log('zones',zones);
  return(
    <div className="fz-text-view">
      <div className="fz-text-display">
        {zones.map((zone) =>
          <FZZoneView key={zone.id} zone={zone}/>
        )}
      </div>
    </div>
  )
}

export default FZTextView;
