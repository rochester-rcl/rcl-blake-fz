/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

// utils
import { formatStage } from '../utils/data-utils';

// shortid
import shortid from 'shortid';

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
          {sortedZones.map((zone, index) =>
            <FZZoneView
              key={index}
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
    if (stages) {
      return(
        <div className="fz-text-display-line stages" onClick={ () => this.expandStages() }>
          {stages.map((stage, index) =>
            <FZStage key={index} expanded={expanded} stage={stage} stageType={stage.type} />
          )}
        </div>
      );
    } else {
      return(
        <div className="fz-text-display-line stages">
        </div>
      );
    }
  }
}

const FZStage = (props: Object) => {
  const { expanded, stageType, stage } = props;
  const formatGap = (stage: Object) => {
    if (stage.gap) {
      let gap;
      // todo find a beter way to handle polymorphic properties i.e. Object vs Array<Object>
      if (stage.gap.constructor === Array) {
        gap = stage.gap[0];
      } else {
        gap = stage.gap;
      }
      if (gap.attributes.unit === 'line') {
        return 100;
      } else {
        return Number(gap.attributes.extent);
      }
    }
    return 0;
  };
  let expandedState = expanded ? 'expanded' : 'collapsed';
  let className = ['fz-text-display-stage', stageType, expandedState, formatStage(stage)].reduce((classA, classB) => {
    return classA + ' ' + classB;
  });
  return(
    <span className={className}>
      {stage['#text'] ? stage['#text'] : '\xa0'.repeat(formatGap(stage))}
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
          renderLine(diplomaticMode, line)
        )}
      </div>
    );
  }

  const renderLine = (mode: bool, line: Object) => {
    let indent = (line) => {
      if (line.attributes) {

        if (line.attributes.indent) {
          return '\xa0'.repeat(Number(line.attributes.indent));
        }

        if (line.diplomatic.attributes) {
          return '\xa0'.repeat(Number(line.diplomatic.attributes.indent));
        }

        return '';
      }
    }

    return (
      <span key={line.id} className="fz-text-line-container">
        {mode ? <FZDiplomaticView key={line.id} keyVal={line.id} diplomatic={line.diplomatic} indent={indent(line)} /> :
        <FZStageView key={line.id} stages={line.stage.content} />}
      </span>
    );
  }

  const FZDiplomaticView = (props: Object) => {
    const { diplomatic, indent } = props;
    return(
      <div key={shortid.generate()} className='fz-text-display-line diplomatic'>
        {indent}
        {formatDiplomaticText(diplomatic)}
      </div>
    );
  }
  if (zone.lineGroups) {
    return(
      <div key={zone.id} className={"fz-text-display-zone " + zone.type}>
        {zone.lineGroups.map((lineGroup) =>
          <FZLineGroupView key={lineGroup.id} lineGroup={lineGroup} />
        )}
      </div>
    );
  } else {
    return(
      <div key={zone.id} className={"fz-text-display-zone " + zone.type}>
      </div>
    );
  }
}

const makeSpaces = (nSpaces: Number) => {
  let spaceArray = new Array(nSpaces);
  spaceArray.fill(' ');
  return spaceArray.join('');
}

const formatDiplomaticText = (diplomatic: Array) => {
  let formatted = [];
  const getDelType = (del) => {
    switch(del.attributes.type) {
      case 'overstrike':
        return 'tei-del-overstrike';

      case 'overwrite':
        return 'tei-del-overwrite';

      default:
        return 'some-class';
    }
  }

  const doDeletion = (element, dstArray) => {
    let deletion = element;
    if (deletion.constructor !== Array) {
      deletion = [deletion];
    }
    deletion.forEach((delElement, index) => {
      let delClass = getDelType(delElement);
      dstArray.push(<span key={index} className={delClass}>{delElement["#text"]}</span>);
    });
  }

  const formatHandShift = (element) => {
    return(
      <span className="tei-instr-pencil">
        {element.map((node, index) => {
          if (typeof node === 'string') return <span key={index}>{node}</span>
          if (typeof node === 'object') {
            if (node.nodeType === 'unclear') {
              return <span key={index} className="tei-unclear-hi">{node["#text"]}</span>
            }
            if (node.nodeType === 'del') {
              let delClass = getDelType(node);
              return <span key={index} className={delClass + ' tei-instr-pencil'}>{node["#text"]}</span>
            }
          }
        })}
      </span>
    );
  }

  diplomatic.forEach((element, index) => {
    let key = shortid.generate();
    if ( element instanceof Object) {
      switch(element.nodeType) {
        case 'space':
          formatted.push(<span key={key}>{makeSpaces(element.space.extent)}</span>);
          break;

        case 'add':
          formatted.push(<span key={key} className="tei-add">{element["#text"]}</span>);
          break;

        case 'del':
          doDeletion(element, formatted);
          break;

        case 'handShift':
          formatted.push(formatHandShift(element));
          break;

        case 'subst':
          let subst = [];
          if (element.del) {
            doDeletion(element.del, subst);
          }

          if (element.add) {
            subst.push(<span key={key} className="tei-add">{element.add["#text"]}</span>);
          }
          formatted.push(<span key={key} className="tei-subst">{subst}</span>);
          break;

        /*case 'handShift':
            formatted.push(<span key={key} className="tei-instr-pencil">{element["text"]}</span>);
            break;*/

        default:
          break;
      }
    }
    if (typeof element === 'string') {
      formatted.push(<span key={key}>{element}</span>);
    }
  });
  return formatted;
}
