import React from "react";

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

const Backgrounds = {
  del: DelBackground,
  gap: GapBackground,
};

export function Space(props) {
  const { n, size, direction } = props;
  const space = n || 0;
  const spaceChar = `\xa0`;
  if (direction === "horizontal") {
    return <tspan dx={size}>{spaceChar}</tspan>;
  } else {
    return <tspan dy={size}>{spaceChar}</tspan>;
  }
}

export function Gap(props) {
  const { gap, textRef } = props.line;
  const extent = gap.extent || "1";
  const size = textRef ? textRef.getExtentOfChar(`\xa0`).width : 0;
  return (
    <tspan textDecoration="line-through">
      <Space extent={extent} direction="horizontal" size={size} />
    </tspan>
  );
}

export function Del(props) {
  const { del } = props.line;
  const delType = del.attributes ? del.attributes.type : DelTypes.overwrite;
  const text = del && del["#text"];
  if (!text) {
    return null;
  }
  if (del.children) {
    const children = del.children.map((child) => <FormatLine line={child} />);
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

function FormattedLine(props) {
  const { line, textRef } = props;
  if (!line) {
    return null;
  }
  const text = line["#text"] || "";
  for (const key in line) {
    if (key === "del") {
      return <Del line={line} />;
    }
    if (key === "gap") {
      return <Gap line={line} textRef={textRef} />;
    }
  }
  return <tspan>{text}</tspan>;
}

function getAttributes(attributes) {
  return attributes
    ? Object.keys(attributes).map((key) => [key, attributes[key]])
    : [];
}

function GapBackground(props) {
  const { x, y, h, textRef, node } = props;
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
              // TODO process child backgrounds recursively - increase offset x y
              return prop.children.map((child, idx) => {
                const prevNode = idx > 0 ? prop.children[idx - 1] : null;
                return (
                  <Background
                    previousNode={prevNode}
                    textRef={textRef}
                    line={child}
                  />
                );
              });
            }
            // TODO check attributes
            if (Backgrounds[prop.nodeType]) {
              const Component = Backgrounds[prop.nodeType];
              const text = prop["#text"] || "";
              const pos = computeTextPosition(text, textRef);
              return <Component {...pos} node={prop} />;
            }
          }
          return null;
        });
      } else {
        if (Backgrounds[node.nodeType]) {
          const Component = Backgrounds[node.nodeType];
          const text = node["#text"] || "";
          const pos = computeTextPosition(text, textRef);
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

export function FormatLine(props) {
  const { line, textRef } = props;
  const attributes = getAttributes(line && line.attributes);
  if (typeof line === "string") {
    return <tspan>{line}</tspan>;
  }
  return (
    <tspan>
      {attributes.map((attribute) => (
        <FormattedAttribute
          attribute={attribute[0]}
          value={attribute[1]}
          textRef={textRef}
        />
      ))}
      <FormattedLine line={line} textRef={textRef} />
    </tspan>
  );
}
