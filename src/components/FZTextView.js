/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

export default class FZTextView extends Component {
  state = { expanded: false };
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
    const { zones, diplomaticMode } = this.props;
    const { expanded } = this.state;
    let sortedZones = zones.sort((zone) => {
      let zoneType = zone.type;
      if (zoneType === 'left') return -1;
      if (zoneType === 'right') return 1;
      return 0;
    });

    return(
      <div className="fz-text-view">
        <div className="fz-text-display">
          {sortedZones.map((zone) =>
            <FZZoneView
              key={zone.id}
              diplomaticMode={diplomaticMode}
              expanded={expanded}
              expandStages={this.expandStages}
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
          <FZStage key={index} expanded={expanded} text={stage['#text']} stageType={stage.type} />
        )}
      </div>
    );
  }
}

const FZStage = (props: Object) => {
  const { expanded, stageType, text } = props;
  let expandedState = expanded ? 'expanded' : 'collapsed';
  return(
    <div className={'fz-text-display-stage ' + stageType + ' ' + expandedState}>
      {text}
    </div>
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
        {diplomatic['#text']}
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
