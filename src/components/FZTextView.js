/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

class FZStage extends Component {
  render() {
    const { expanded, stageType, text } = this.props;
    let expandedState = expanded ? 'expanded' : 'collapsed';
    return(
      <div className={'fz-text-display-stage ' + stageType + ' ' + expandedState}>
        {text}
      </div>
    );
  }
}

const FZTextView = (props: Object) => {

  const { zones, diplomaticMode } = props;

  let sortedZones = zones.sort((zone) => {
    let zoneType = zone.type;
    if (zoneType === 'left') return -1;
    if (zoneType === 'right') return 1;
    return 0;
  });

  const FZLineGroupView = (props: Object) => {
    const { lineGroup } = props;
    return(
      <div key={lineGroup.id} className="fz-text-display-line-group">
        {lineGroup.lines.map((line) =>
          diplomaticMode ? <FZDiplomaticView key={line.id} diplomatic={line.diplomatic} /> :
          <FZStageView key={line.id} stages={line.stage.content} />
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

  let stagesExpanded = false;

  const expandStages = (props: Object) => {
    if (!stagesExpanded) {
      stagesExpanded = true;
    } else {
      stagesExpanded = false;
    }
  }

  const FZStageView = (props: Object) => {
    const { stages } = props;
    console.log(stages);

    return(
      <div className="fz-text-display-line stages" onClick={ () => expandStages() }>
        {stages.map((stage, index) =>
          <FZStage key={index} expanded={stagesExpanded} text={stage['#text']} stageType={stage.type} />
        )}
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

  return(
    <div className="fz-text-view">
      <div className="fz-text-display">
        {sortedZones.map((zone) =>
          <FZZoneView key={zone.id} zone={zone}/>
        )}
      </div>
    </div>
  )
}

export default FZTextView;
