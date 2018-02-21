/* @flow */

// React
import React, { Component } from 'react';

// Semantic UI
import { Segment } from 'semantic-ui-react';

// utils
import { formatStage } from '../utils/data-utils';

// shortid
import shortid from 'shortid';

const GAP_SIZE = '\xa0\xa0';

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

const gapClass = (gap: Object) => {
  if (gap.reason) {
    if (gap.reason.includes('cancellation') || gap.reason === 'overwrite' || gap.reason === 'erasure') {
      return 'tei-gap-cancellation';
    }
    return 'tei-gap';
  }
  return 'tei-gap';
}

const formatGap = (stage: Object) => {
  if (stage.gap) {
    let gap;
    // todo find a beter way to handle polymorphic properties i.e. Object vs Array<Object>
    if (stage.gap.constructor === Array) {
      gap = stage.gap[0];
    } else {
      gap = stage.gap;
    }
    if (gap.unit === 'line') {
      return 100;
    } else {
      return Number(gap.extent);
    }
  }
  return 0;
};

const FZStage = (props: Object) => {
  const { expanded, stageType, stage } = props;
  let expandedState = expanded ? 'expanded' : 'collapsed';
  let className = ['fz-text-display-stage', stageType, expandedState, formatStage(stage)].reduce((classA, classB) => {
    return classA + ' ' + classB;
  });
  return(
    <span className={className}>
      {stage['#text'] ? stage['#text'] : GAP_SIZE.repeat(formatGap(stage))}
    </span>
  );
}

const FZZoneView = (props: Object) => {
  const { zone, expanded, expandStages, diplomaticMode } = props;
  const renderVSpace = (vSpaceExtent: Number) => {
    let vSpaceArray = new Array(vSpaceExtent);
    vSpaceArray.fill(' ');
    return vSpaceArray;
  }

  const FZLineGroupView = (props: Object) => {
    const { lineGroup } = props;
    const getRotation = (attributes) => {
      let lineGroupClass = "fz-text-display-line-group";
      if (!attributes) return lineGroupClass;
      if (attributes.style) {
        let orientation = attributes.style.split(' ').pop();

        switch(orientation) {
          case('sideways-right'):
            return lineGroupClass += ' sideways-right';

          case('sideways-left'):
            return lineGroupClass += ' sideways-left';

          default:
            return lineGroupClass;

        }
      }
    }
    return(
      <div key={lineGroup.id} className={getRotation(lineGroup.attributes)}>
        {renderVSpace(lineGroup.vspaceExtent).map((space, index) =>
          <br key={index} />
        )}
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
          return GAP_SIZE.repeat(Number(line.attributes.indent));
        }

        if (line.diplomatic.attributes) {
          return GAP_SIZE.repeat(Number(line.diplomatic.attributes.indent));
        }

        return '';
      }
    }
    let _indent;
    let diplomaticIndent = line.diplomatic.find((element) => {
      return element.hasOwnProperty('indent') === true;
    });
    if (diplomaticIndent) {
      _indent = GAP_SIZE.repeat(Number(diplomaticIndent.indent));
    } else {
      _indent = indent(line);
    }
    return (
      <span key={line.id} className="fz-text-line-container">
        {mode ? <FZDiplomaticView key={line.id} keyVal={line.id} diplomatic={line.diplomatic} indent={_indent} /> :
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
  nSpaces *= 2;
  let spaceArray = new Array(nSpaces);
  spaceArray.fill(GAP_SIZE);
  return spaceArray.join('');
}

const formatDiplomaticText = (diplomatic: Array) => {
  let formatted = [];
  const getDelType = (del) => {
    switch(del.attributes.type) {
      case 'overstrike':
        return 'tei-del-overstrike';

      case 'erasure':
        return 'tei-del-erasure';

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
      let formatted = [];
      if (delElement.hi) {
        formatted.push(formatHi(delElement.hi));
      }
      if (delElement.choice) {
        formatted.push(formatChoice(delElement.choice));
      }
      if (delElement.space) {
        formatted.push(makeSpaces(delElement.space.space.extent));
      }
      if (delElement.unclear) {
        formatted.push(<span key={shortid.generate()} className="tei-unclear-hi">{element.unclear['#text']}</span>);
      }
      formatted.push(delElement["#text"]);
      dstArray.push(<span key={shortid.generate()} className={delClass}>{[...formatted]}</span>);
    });
  }

  const formatHi = (hi) => {
    if (hi.attributes) {
      if (hi.attributes.rend) {
        switch(hi.attributes.rend) {
          case 'subscript':
            return <sub>{hi['#text']}</sub>;

          case 'superscript':
            return <sup>{hi['#text']}</sup>;

          default:
            return <span>{hi['#text']}</span>;
        }
      } else {
        console.log("HI has no rend attribute");
      }
    } else {
      console.log("HI has no attributes");
    }
  }

  const formatChoice = (element) => {
    return element.orig["#text"];
  }

  const formatAdd = (element, key) => {
    let innerElement;
    if (element.hi) {
      innerElement = formatHi(element.hi);
    }
    if (element.handShift) {
      innerElement = formatHandShift(element.handShift);
    }
    return <span key={key} className="tei-add">{element["#text"]}{innerElement}</span>
  }

  const formatHandShift = (element) => {
    return(
      <span className="tei-instr-pencil">
        {element.map((node, index) => {
          if (typeof node === 'string') return <span key={index}>{node}</span>
          if (typeof node === 'object') {
            switch(node.nodeType) {
              case 'unclear':
                return <span key={index} className="tei-unclear-hi">{node["#text"]}</span>

              case 'del':
                let delClass = getDelType(node);
                return <span key={index} className={delClass + ' tei-instr-pencil'}>{node["#text"]}</span>


              case 'add':
                return formatAdd(node, index);

              default:
                break;
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
          formatted.push(formatAdd(element));
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

          if (element.gap) {
            subst.push(<span key={key + '$'} className={gapClass(element.gap.gap)}>{GAP_SIZE.repeat(formatGap(element.gap))}</span>);
          }

          if (element.add) {
            subst.push(<span key={key} className="tei-add">{element.add["#text"]}</span>);
          }


          formatted.push(<span key={key} className="tei-subst">{subst}</span>);
          break;

        case 'gap':
          formatted.push(<span key={key} className={gapClass(element.gap)}>{GAP_SIZE.repeat(formatGap(element))}</span>);
          break;

        case 'anchor':
          break;

        case 'choice':
          formatted.push(formatChoice(element));
          break;
        /*case 'handShift':
            formatted.push(<span key={key} className="tei-instr-pencil">{element["text"]}</span>);
            break;*/

        default:
          formatted.push(<span key={key}>{element['#text']}</span>);
          break;
      }
    }
    if (typeof element === 'string') {
      formatted.push(<span key={key}>{element}</span>);
    }
  });
  return formatted;
}
