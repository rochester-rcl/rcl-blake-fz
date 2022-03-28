import React from "react";
import shortid from "shortid";

const DelTypes = {
  erasure: "erasure",
  overwrite: "overwrite",
};

const BackgroundColors = {
  overwrite: "#eee",
  erasure: "#d3d3d3",
  obscured: "#d3d3d3",
  hr: "#eee",
  subst: "#e9bb01",
  gap: "#ccc",
  hspace: "#e9bb01",
  delspan: "#d3d3d3",
};

const TextColors = {
  add: "#168bc1",
};

const Backgrounds = {
  del: DelBackground,
  gap: GapBackground,
  subst: SubstBackground,
};

export function Space(props) {
  const { n, size, direction } = props;
  const space = parseInt(n, 10);
  const s = !isNaN(space) ? space : 1;
  const spaceChar = `\xa0\xa0`;
  const x = size * space;
  const spaces = new Array(s).fill(spaceChar).join("");
  if (direction === "horizontal") {
    return <tspan>{spaces}</tspan>;
  } else {
    return <tspan>{spaces}</tspan>;
  }
}

export function Gap(props) {
  const { textRef, gap } = props;
  const extent = parseInt(gap.extent, 10) || "1";
  const size = textRef ? textRef.getExtentOfChar(`\xa0`).width : 0;
  return (
    <tspan textDecoration="line-through">
      <Space n={extent} direction="horizontal" size={size} />
    </tspan>
  );
}

export function Subst(props) {
  const { textRef, subst } = props;
  const { del, add } = subst;
  if (!del || !add) {
    return null;
  }
  return (
    <tspan>
      <Del del={del} textRef={textRef} />
      <Add add={add} textRef={textRef} />
    </tspan>
  );
}

export function Choice(props) {
  const { choice } = props;
  return <tspan>{choice.orig["#text"]}</tspan>;
}

export function Catchword(props) {
  const { catchword, textRef } = props;
  return <tspan>{catchword ? catchword["#text"] : ""}</tspan>;
}

export function Hi(props) {
  const { hi } = props;
  let rendType =
    hi.attributes && hi.attributes.rend ? hi.attributes.rend : null;

  function renderHi(text) {
    if (!text) {
      return null;
    }
    if (rendType === "u") {
      return <tspan textDecoration="underline">{text}</tspan>;
    }
    if (rendType === "i") {
      return <tspan fontStyle="italic">{text}</tspan>;
    }
    return <tspan>{text}</tspan>;
  }

  return <tspan>{renderHi(hi["#text"])}</tspan>;
  // TODO figure out how to render whwen hi is actually an array -- see page 10, Aaron and Miriam
}

export function Add(props) {
  const { add } = props;
  if (add.attributes && add.attributes.place === "supralinear") {
    return (
      <tspan baselineShift="super" fill={TextColors.add}>
        {add["#text"]}
      </tspan>
    );
  }
  return (
    <tspan>
      <tspan fill={TextColors.add}>{add["#text"]}</tspan>
    </tspan>
  );
}

export function Del(props) {
  const { textRef, del } = props;
  const delType = del.attributes ? del.attributes.type : DelTypes.overwrite;

  function formatDel() {
    const text = del && del["#text"];
    if (!text) {
      return null;
    }
    if (del.children) {
      const children = del.children.map((child) => (
        <FormatLine key={shortid.generate()} line={child} textRef={textRef} />
      ));
      return (
        <tspan fill="red" textDecoration="line-through">
          {children}
        </tspan>
      );
    } else {
      return (
        <tspan fill="red" textDecoration="line-through">
          {text}
        </tspan>
      );
    }
  }
  return formatDel();
}

function DelBackground(props) {
  const { x, y, w, h, node } = props;
  const delType = node.attributes ? node.attributes.type : DelTypes.overwrite;
  if (delType === DelTypes.erasure) {
    return (
      <rect x={x} y={y} width={w} height={h} fill={BackgroundColors.erasure} />
    );
  }
  return null;
}

function SubstBackground(props) {
  const { x, y, w, h, node } = props;
  return (
    <rect x={x} y={y} width={w} height={h} fill={BackgroundColors.subst} />
  );
}

function FormattedAttribute(props) {
  const { attribute, value, textRef } = props;
  switch (attribute) {
    case "indent":
      const size = textRef ? textRef.getExtentOfChar(`\xa0`).width : 0;
      return <Space n={value} direction="horizontal" size={size} />;
    default:
      return null;
  }
}

// TODO need to completely rewrite this to account for multiple tags in a single line - see Hi for an idea of how to implement using text position
// and a cursor

// possible algorithm
// 1. Sort all properties by text position
// 2. Insert <tspan> elements in the line array between all components
// 2. Get cursor position for each component - pass to the component as a prop

function sortLinePropsByTextPosition(line) {
  let l = [];
  for (const key in line) {
    let { rawText } = line;
    if (line[key].constructor.name === "Array") {
      for (let val of line[key]) {
        if (typeof val === "string") {
          l.push([
            "text",
            {
              textContent: val,
              nodeType: "text",
              textPosition: (rawText && rawText.indexOf(val)) || 0,
            },
          ]);
        } else {
          l.push([val.nodeType, val]);
        }
      }
    } else {
      if (key === "#text") {
        l.push([
          "text",
          {
            textContent: line[key],
            nodeType: "text",
            textPosition: rawText && rawText.indexOf(line[key]),
          },
        ]);
      } else {
        l.push([key, line[key]]);
      }
    }
  }
  return l.sort((a, b) => a[1].textPosition - b[1].textPosition);
}

function FormattedLine(props) {
  const { line, textRef, zoneRoi } = props;

  if (!line) {
    return null;
  }

  const l = sortLinePropsByTextPosition(line);
  const components = l.map(([key, val]) => {
    if (key === "del") {
      return <Del key={shortid.generate()} del={val} textRef={textRef} />;
    }
    if (key === "add") {
      return <Add add={val} textRef={textRef} />;
    }
    if (key === "gap") {
      return <Gap gap={val} textRef={textRef} />;
    }
    if (key === "subst") {
      return <Subst subst={val} textRef={textRef} />;
    }
    if (key === "hi") {
      return <Hi hi={val} textRef={textRef} />;
    }
    if (key === "choice") {
      return <Choice choice={val} textRef={textRef} />;
    }
    if (key === "catchword") {
      return <Catchword catchword={val} textRef={textRef} zoneRoi={zoneRoi} />;
    }
    if (key === "text") {
      return <tspan>{val.textContent}</tspan>;
    }
    return null;
  });
  return <>{components}</>;
}

function getAttributes(attributes) {
  return attributes
    ? Object.keys(attributes).map((key) => [key, attributes[key]])
    : [];
}

function GapBackground(props) {
  const { x, y, h, textRef, node } = props;
  if (!textRef) {
    return null;
  }
  const s = textRef.getExtentOfChar(`\xa0`).width;
  const { gap } = node;
  const extent = parseInt(gap.extent, 10);
  const width = !isNaN(extent) ? extent * s : 0;
  return (
    <rect x={x} y={y} width={width} height={h} fill={BackgroundColors.gap} />
  );
}

function computeTextPosition(text, textRef) {
  try {
    const { textContent } = textRef;
    const { y, height } = textRef.getBBox();
    const start = textContent.indexOf(text);
    const end = textContent.indexOf(text) + text.length - 1;
    const p1 = textRef.getStartPositionOfChar(start);
    const p2 = textRef.getEndPositionOfChar(end);
    return { x: p1.x, y, w: p2.x - p1.x, h: height };
  } catch (error) {
    return null;
  }
}

export function Background(props) {
  const { previousNode, line, textRef } = props;
  if (!line) {
    return null;
  }
  const formatBackground = (node) => {
    // recursively format background
    if (typeof node === "object") {
      if (node.hasOwnProperty("nodeType") && node.nodeType === "l") {
        return Object.keys(node).map((key) => {
          const prop = node[key];
          if (typeof prop === "object" && prop.hasOwnProperty("nodeType")) {
            // prop is a node - check if it needs a background
            if (prop.children) {
              const backgrounds = prop.children.map((child, idx) => {
                const prevNode = idx > 0 ? prop.children[idx - 1] : null;
                return (
                  <Background
                    key={`background-${idx}`}
                    previousNode={prevNode}
                    textRef={textRef}
                    line={child}
                  />
                );
              });
              // node also has a background (i.e. subst)
              if (Backgrounds[prop.nodeType]) {
                backgrounds.push(
                  <Background
                    key={prop.nodeType}
                    previousNode={null}
                    textRef={textRef}
                    line={prop}
                  />
                );
              }
              return backgrounds;
            }
            if (Backgrounds[prop.nodeType]) {
              // TODO figure out how to fix Gap background when appearing in an array of text
              // see p. 17 zone marginalia-1
              const Component = Backgrounds[prop.nodeType];
              const text = prop["#text"] || "";
              const pos = computeTextPosition(text, textRef);
              return (
                <Component
                  key={`text-${pos ? pos.x : shortid.generate()}-${
                    pos ? pos.y : shortid.generate()
                  }`}
                  {...pos}
                  node={prop}
                />
              );
            }
          }
          return null;
        });
      } else {
        if (Backgrounds[node.nodeType]) {
          const Component = Backgrounds[node.nodeType];
          let text = node["#text"];
          if (!text && node.children) {
            // try to grab all children text
            text = node.children.reduce((t, child) => {
              t += child["#text"] || "";
              return t;
            }, "");
          }

          let pos = computeTextPosition(text, textRef);
          if (pos) {
            return <Component {...pos} node={node} textRef={textRef} />;
          } else {
            // node has no text position i.e. a gap, try to get the offset from the previous node
            if (previousNode) {
              const prevText =
                typeof previousNode === "string"
                  ? previousNode
                  : typeof previousNode === "object"
                  ? previousNode["#text"]
                  : "";
              const offset = computeTextPosition(prevText, textRef);
              if (offset) {
                return (
                  <Component
                    x={offset.x + offset.w}
                    y={offset.y}
                    w={0}
                    h={offset.h}
                    node={node}
                    textRef={textRef}
                  />
                );
              }
            }
          }
          return null;
        }
      }
    }
    return null;
  };
  return formatBackground(line);
}

export function FormatTextFoot(props) {
  let { textFoot } = props;
  return <FormatLine line={textFoot.l} />;
}

export function FormatLine(props) {
  const { line, textRef, zoneRoi } = props;
  const attributes = getAttributes(line && line.attributes);
  if (typeof line === "string") {
    return <tspan>{line}</tspan>;
  }
  return (
    <tspan>
      {attributes.map((attribute) => (
        <FormattedAttribute
          key={attribute[0]}
          attribute={attribute[0]}
          value={attribute[1]}
          textRef={textRef}
        />
      ))}
      <FormattedLine line={line} textRef={textRef} zoneRoi={zoneRoi} />
    </tspan>
  );
}
