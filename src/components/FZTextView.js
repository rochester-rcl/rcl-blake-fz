/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

// utils
import { formatStage } from '../utils/data-utils';

const ZONE_MAP = {
  left: 0,
  body: 1,
  head: 2,
  foot: 3,
  right: 4,
}

export default class FZTextView extends Component {
  render(){
    const { zones, diplomaticMode } = this.props;
    let sortedZones = zones.sort((zoneA, zoneB) => {
      let zoneTypeA = zoneA.type;
      let zoneTypeB = zoneB.type;
      if (ZONE_MAP[zoneTypeA] < ZONE_MAP[zoneTypeB]) return -1;
      if (ZONE_MAP[zoneTypeA] > ZONE_MAP[zoneTypeB]) return 1;
      return 0;
    });

    return(
      <div className="fz-text-view">
        <div className="fz-text-display">
          {sortedZones.map((zone) =>
            <FZZoneView
              key={zone.id}
              diplomaticMode={diplomaticMode}
              zone={zone}/>
          )}
        </div>
      </div>
    );
  }
}

class FZStageView extends Component {
  state = { expanded: false }
  constructor(props: Object) {
    super(props);
    (this :any).expandStages = this.expandStages.bind(this);
  }
  expandStages(): void {
    if (this.state.expanded) {
      this.setState({ expanded: false });
    } else {
      this.setState({ expanded: true });
    }
  }

  render(){
    const { stages } = this.props;
    const { expanded } = this.state;
    return(
      <div className="fz-text-display-line stages" onClick={ () => this.expandStages() }>
        {stages.map((stage, index) =>
          <FZStage key={index} expanded={expanded} stage={stage} stageType={stage.type} />
        )}
      </div>
    );
  }
}

const FZStage = (props: Object) => {
  const { expanded, stageType, stage } = props;
  let expandedState = expanded ? 'expanded' : 'collapsed';
  let className = ['fz-text-display-stage', stageType, expandedState, formatStage(stage)].reduce((classA, classB) => {
    return classA + ' ' + classB;
  });
  return(
    <span className={className}>
      {stage['#text'] ? stage['#text'] : '\xa0'}
    </span>
  );
}

const FZZoneView = (props: Object) => {
  const { zone, expanded, expandStages, diplomaticMode } = props;

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
        {formatDiplomaticText(diplomatic)}
      </div>
    );
  }

  return(
    <div key={zone.id} className={"fz-text-display-zone " + zone.type}>
      {zone.lineGroups.map((lineGroup) =>
        <FZLineGroupView key={lineGroup.id} lineGroup={lineGroup} />
      )}
    </div>
  );
}

const formatDiplomaticText = (diplomatic: Object) => {
  let formattedText;
  let space = '';
  if (diplomatic['#text']) {
    if (diplomatic['#text'].constructor === Array) {
      if (diplomatic.space) space = ' ';
      formattedText = diplomatic['#text'].reduce((text1, text2) => text1 + space + text2)
    } else {
      formattedText = diplomatic['#text'];
    }
  }
  return formattedText;
}
