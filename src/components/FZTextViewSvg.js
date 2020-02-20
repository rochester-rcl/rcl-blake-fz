/* @flow */

// React
import React, { Component } from "react";

// Semantic UI
import { Segment } from "semantic-ui-react";

// utils
import { formatStage, pointsToNumbers } from "../utils/data-utils";

// shortid
import shortid from "shortid";

const GAP_SIZE = "\xa0\xa0";

const ZONE_MAP = {
  left: 0,
  body: 1,
  head: 2,
  foot: 3,
  right: 4
};

export default class FZTextView extends Component {
  zoneRefs = [];
  render() {
    const { zones, diplomaticMode, displayAngle, lockRotation } = this.props;
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
      <div className="fz-text-view">
        <div className={baseClass} style={rotate}>
          {sortedZones.map((zone, index) => (
            <FZZoneView
              ref={ref => this.zoneRefs.push(ref)}
              key={index}
              lockRotation={lockRotation}
              diplomaticMode={diplomaticMode}
              zone={zone}
            />
          ))}
        </div>
      </div>
    );
  }
}

class FZStageView extends Component {
  state = { expanded: false };
  constructor(props: Object) {
    super(props);
    (this: any).expandStages = this.expandStages.bind(this);
  }
  expandStages(): void {
    if (this.state.expanded) {
      this.setState({ expanded: false });
    } else {
      this.setState({ expanded: true });
    }
  }

  render() {
    const { stages, indent } = this.props;
    const { expanded } = this.state;
    if (stages) {
      return (
        <span className="fz-text-display-line-stages-container">
          {indent}
          <span
            className="fz-text-display-line stages"
            onClick={() => this.expandStages()}
          >
            {stages.map((stage, index) => (
              <FZStage
                key={index}
                expanded={expanded}
                stage={stage}
                stageType={stage.attributes.type}
              />
            ))}
          </span>
        </span>
      );
    } else {
      return <div className="fz-text-display-line stages"></div>;
    }
  }
}

const gapClass = (gap: Object) => {
  if (gap.reason) {
    if (
      gap.reason.includes("cancellation") ||
      gap.reason === "overwrite" ||
      gap.reason === "erasure"
    ) {
      return "tei-gap-cancellation";
    }
    return "tei-gap";
  }
  return "tei-gap";
};

const formatGap = (element: Object) => {
  if (element.gap) {
    let gap;
    let units;

    // todo find a beter way to handle polymorphic properties i.e. Object vs Array<Object>
    if (element.gap.constructor === Array) {
      gap = element.gap[0];
    } else {
      gap = element.gap;
    }
    let _gapClass = gapClass(element.gap);
    if (gap.unit === "line") {
      units = 60;
      _gapClass += " gap-line";
    } else {
      units = Number(gap.extent);
    }
    return (
      <span key={shortid.generate()} className={_gapClass}>
        {GAP_SIZE.repeat(units)}
      </span>
    );
  }
};

const FZStage = (props: Object) => {
  const { expanded, stageType, stage } = props;
  let expandedState = expanded ? "expanded" : "collapsed";
  let className = [
    "fz-text-display-stage",
    stageType,
    expandedState,
    formatStage(stage)
  ].reduce((classA, classB) => {
    return classA + " " + classB;
  });

  return <span className={className}>{formatDiplomaticText(stage)}</span>;
};

export class FZZoneView extends Component {
  state = { fontSize: null };
  constructor(props: Object) {
    super(props);
    this.renderVSpace = this.renderVSpace.bind(this);
    this.FZLineGroupView = this.FZLineGroupView.bind(this);
    this.FZDiplomaticView = this.FZDiplomaticView.bind(this);
    this.renderLine = this.renderLine.bind(this);
    this.fontSize = 10;
  }

  componentDidMount() {
    if (this.rectRef) {
      this.calculateFontSize(this.rectRef.getBoundingClientRect());
    }
  }

  calculateFontSize(rect) {
    const { zone } = this.props;
    let defaultFontSize = parseInt(
      window
        .getComputedStyle(this.rectRef)
        .getPropertyValue("font-size")
        .split("px")[0],
      10
    );
    let longestLine = 0;
    let lineId = null;
    zone.lineGroups.forEach(lg => {
      let lineInfo = this.calculateLongestLine(lg);
      if (lineInfo.count > longestLine) {
        longestLine = lineInfo.count;
        lineId = lineInfo.id;
      }
    });
    const clientLineWidth = document
      .getElementById(lineId)
      .getBoundingClientRect().width;
    const clientLineFontSize = clientLineWidth / longestLine;
    const targetFontSize = rect.width / longestLine;
    const sf = defaultFontSize / clientLineFontSize;
    this.setState({
      fontSize: (targetFontSize / defaultFontSize) * sf
    });
  }

  calculateLongestLine(lg) {
    let longestLine = 0;
    let lineId = null;
    lg.lines.forEach(line => {
      let lineCount = line.diplomatic.reduce((a, b) => {
        if (typeof b === "string") {
          return a + b.length;
        }
      }, 0);
      if (lineCount > longestLine) {
        longestLine = lineCount;
        lineId = line.id;
      }
    });
    return { id: lineId, count: longestLine };
  }

  renderVSpace(vSpaceExtent: number) {
    let vSpaceArray = new Array(vSpaceExtent);
    vSpaceArray.fill(" ");
    return vSpaceArray;
  }

  FZLineGroupView(props: Object) {
    const { diplomaticMode, style } = this.props;
    const { lineGroup } = props;
    const getRotation = attributes => {
      let lineGroupClass = "fz-text-display-line-group";
      if (!attributes) return lineGroupClass;
      if (attributes.style) {
        let orientation = attributes.style.split(" ").pop();

        switch (orientation) {
          case "sideways-right":
            return (lineGroupClass += " sideways-right");

          case "sideways-left":
            return (lineGroupClass += " sideways-left");

          default:
            return lineGroupClass;
        }
      }
    };
    return (
      // TODO deal with rotation here
      lineGroup.lines.map(line => this.renderLine(diplomaticMode, line))
    );
  }

  renderLine(mode: boolean, line: Object) {
    const { style } = this.props;
    let indent = line => {
      if (line.attributes) {
        if (line.attributes.indent) {
          return GAP_SIZE.repeat(Number(line.attributes.indent));
        }

        if (line.diplomatic && line.diplomatic.attributes) {
          return GAP_SIZE.repeat(Number(line.diplomatic.attributes.indent));
        }

        return "";
      }
    };
    let _indent;
    let rawIndent;
    if (line.diplomatic) {
      const i = line.diplomatic.find(element => {
        return element.hasOwnProperty("indent") === true;
      });
      if (i) {
        rawIndent = i.indent;
      }
    } else {
      rawIndent = line.attributes.indent;
    }

    let stageIndent =
      line.stage !== undefined && line.stage.indent !== undefined;
    if (rawIndent) {
      _indent = GAP_SIZE.repeat(Number(rawIndent));
    } else if (stageIndent) {
      _indent = GAP_SIZE.repeat(Number(line.stage.indent));
    } else {
      _indent = indent(line);
    }
    const lineProps = {
      key: line.id,
      keyVal: line.id,
      indent: indent,
      style: style
    };
    const diplomaticProps = {
      key: line.id,
      keyVal: line.id,
      diplomatic: line.diplomatic,
      indent: indent,
      style: style
    };
    if (line.diplomatic) {
      lineProps.diplomatic = line.diplomatic;
      return mode ? (
        this.FZDiplomaticView(lineProps)
      ) : (
        <FZStageView
          key={line.id}
          stages={line.stage.content}
          indent={_indent}
        />
      );
    } else {
      lineProps.content = line.content;
      return this.FZLineView(lineProps);
    }
  }

  FZLineView(props) {
    const { key, style, indent, content } = props;
    return (
      <tspan id={key} x={style.left} key={key} dy="1em" className="svg-text">
        {typeof content === "string" ? content : null}
      </tspan>
    );
  }

  FZDiplomaticView(props: Object) {
    const { diplomatic, indent, style, key } = props;
    return diplomatic.map((val, index) => (
      <tspan
        id={key}
        x={style.left}
        key={key + index}
        dy="1em"
        className="svg-text"
      >
        {typeof val === "string" ? val : null}
      </tspan>
    ));
    /*formatDiplomaticText(diplomatic)*/
  }

  render() {
    const {
      zone,
      expanded,
      expandStages,
      diplomaticMode,
      lockRotation,
      style
    } = this.props;
    const { fontSize } = this.state;
    console.log(fontSize);
    if (zone.lineGroups.length > 0) {
      return (
        <g
          x={style.left}
          y={style.top}
          width={style.width}
          height={style.height}
        >
          <rect
            ref={ref => (this.rectRef = ref)}
            className="zone-rect"
            x={style.left}
            y={style.top}
            width={style.width}
            height={style.height}
          />
          <text
            x={style.left}
            y={style.top}
            width={style.width}
            height={style.height}
            fontSize={fontSize ? `${fontSize}em` : "inherit"}
          >
            {zone.lineGroups.map(lineGroup =>
              this.FZLineGroupView({
                key: lineGroup.id,
                style: style,
                startPos: style.left,
                lineGroup: lineGroup
              })
            )}
          </text>
        </g>
      );
    } else if (zone.columns) {
      let colClass = "fz-text-display-zone-columns ";
      if (zone.columns.orient !== undefined) colClass += zone.columns.orient;
      return (
        <div key={zone.id} className={"fz-text-display-zone " + zone.type}>
          <div className={colClass}>
            {zone.columns.cols.map(column => (
              <div className="fz-text-display-zone-column">
                {column.column.lineGroups.map(lg =>
                  this.FZLineGroupView({
                    key: lg.id,
                    lineGroup: lg
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div
          key={zone.id}
          className={"fz-text-display-zone " + zone.type}
        ></div>
      );
    }
  }
}

const makeSpaces = (nSpaces: Number) => {
  nSpaces *= 2;
  let spaceArray = new Array(nSpaces);
  spaceArray.fill(GAP_SIZE);
  return spaceArray.join("");
};

const formatDiplomaticText = (diplomatic: Array) => {
  let formatted = [];
  const getDelType = del => {
    switch (del.attributes.type) {
      case "overstrike":
        return "tei-del-overstrike";

      case "erasure":
        return "tei-del-erasure";

      default:
        return "some-class";
    }
  };

  const formatChildren = (children: Array<Object>): Array<Object> => {
    let formatted = [];
    children.forEach((child, index) => {
      if (child.hi || child.nodeType === "hi") {
        formatted.push(formatHi(child.hi));
      }
      if (child.choice || child.nodeType === "choice") {
        formatted.push(formatChoice(child));
      }
      if (child.space || child.nodeType === "space") {
        formatted.push(makeSpaces(child.space.extent));
      }
      if (child.unclear || child.nodeType === "unclear") {
        let unclear =
          child.unclear !== undefined ? child.unclear["#text"] : child["#text"];
        formatted.push(
          <span key={shortid.generate()} className="tei-unclear-hi">
            {unclear}
          </span>
        );
      }
      if (child.constructor === String) {
        formatted.push(child);
      }
      if (child.del || child.nodeType === "del") {
        formatted.push(doDeletion(child));
      }
      if (child.add || child.nodeType === "add") {
        formatted.push(formatAdd(child));
      }
      if (child.handShift || child.nodeType === "handShift") {
        formatted.push(formatHandShift(child));
      }
      if (child.gap || child.nodeType === "gap") {
        formatted.push(formatGap(child));
      }
    });
    return formatted;
  };

  const formatSubst = (element: Object) => {
    let formatted;
    if (element.children) {
      formatted = formatChildren(element.children);
    } else {
      formatted = [];
    }
    return (
      <span key={shortid.generate()} className="tei-subst">
        {[...formatted]}
      </span>
    );
  };

  const reduceChildren = (children: Array<Array<Object>>): Array<Object> => {
    return children.reduce((a, b) => a.concat(b), []);
  };

  const doDeletion = element => {
    let deletion = element;
    let delClass = getDelType(deletion);
    let formatted = formatChildren(element.children);
    return (
      <span key={shortid.generate()} className={delClass}>
        {[...formatted]}
      </span>
    );
  };

  const formatHi = hi => {
    if (hi.attributes) {
      if (hi.attributes.rend) {
        switch (hi.attributes.rend) {
          case "subscript":
            return <sub>{hi["#text"]}</sub>;

          case "superscript":
            return <sup>{hi["#text"]}</sup>;

          default:
            return <span>{hi["#text"]}</span>;
        }
      } else {
        console.log("HI has no rend attribute");
      }
    } else {
      console.log("HI has no attributes");
    }
  };

  const formatChoice = element => {
    let choice =
      element.choice !== undefined
        ? element.choice.orig["#text"]
        : element.orig["#text"];
    return choice;
  };

  const formatAdd = element => {
    let formatted = [];
    let inner;
    if (element.children) {
      inner = formatChildren(element.children);
    } else {
      inner = element["#text"] !== undefined ? element["#text"] : "";
    }
    return (
      <span key={shortid.generate()} className="tei-add">
        {inner}
      </span>
    );
  };

  const formatHandShift = element => {
    if (element.constructor === Object) {
      return <span className="tei-instr-pencil"></span>;
    } else {
      return (
        <span className="tei-instr-pencil">
          {element.map((node, index) => {
            if (typeof node === "string")
              return <span key={index}>{node}</span>;
            if (typeof node === "object") {
              switch (node.nodeType) {
                case "unclear":
                  return (
                    <span key={index} className="tei-unclear-hi">
                      {node["#text"]}
                    </span>
                  );

                case "del":
                  let delClass = getDelType(node);
                  return (
                    <span
                      key={index}
                      className={delClass + " tei-instr-pencil"}
                    >
                      {node["#text"]}
                    </span>
                  );

                case "add":
                  return formatAdd(node, index);

                default:
                  break;
              }
            }
          })}
        </span>
      );
    }
  };

  diplomatic.forEach((element, index) => {
    let key = shortid.generate();
    if (element instanceof Object) {
      switch (element.nodeType) {
        case "space":
          formatted.push(
            <span key={key}>{makeSpaces(element.space.extent)}</span>
          );
          break;

        case "add":
          formatted.push(formatAdd(element));
          break;

        case "del":
          formatted.push(doDeletion(element));
          break;

        case "handShift":
          formatted.push(formatHandShift(element));
          break;

        case "subst":
          formatted.push(formatSubst(element));
          break;

        case "gap":
          formatted.push(formatGap(element));
          break;

        case "anchor":
          break;

        case "choice":
          formatted.push(formatChoice(element));
          break;
        /*case 'handShift':
            formatted.push(<span key={key} className="tei-instr-pencil">{element["text"]}</span>);
            break;*/

        default:
          formatted.push(<span key={key}>{element["#text"]}</span>);
          break;
      }
    }
    if (typeof element === "string") {
      formatted.push(<span key={key}>{element}</span>);
    }
  });
  return formatted;
};
