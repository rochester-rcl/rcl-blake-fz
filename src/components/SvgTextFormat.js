import React from "react";
import { Filters } from "./SvgFilters";

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
  const { n, direction } = props;
  const space = n || 0;
  const spaceChar = `\xa0`;
  if (direction === "horizontal") {
    return <tspan dx={`${space}em`}>{spaceChar}</tspan>;
  } else {
    return <tspan dy={`${space}em`}>{spaceChar}</tspan>;
  }
}

export function Gap(props) {
  const { gap } = props.line;
  const extent = gap.extent || "1";
  return (
    <tspan textDecoration="line-through">
      <Space extent={extent} direction="horizontal" />
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
  return (
    <rect x={x} y={y} width={w} height={h} fill={BackgroundColors.erasure} />
  );
  return null;
}

function FormattedAttribute(props) {
  const { attribute, value } = props;
  switch (attribute) {
    case "indent":
      return <Space n={value} direction="horizontal" />;
    default:
      return null;
  }
}

function FormattedLine(props) {
  const { line } = props;
  if (!line) {
    return null;
  }
  const text = line["#text"] || "";
  for (const key in line) {
    if (key === "del") {
      return <Del line={line} />;
    }
    if (key === "gap") {
      return <Gap line={line} />;
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
  const { x, y, w, h } = props;
  return <rect x={x} y={y} width={w} height={h} fill={BackgroundColors.gap} />;
}

function computeTextPosition(text, textRef) {
  const { textContent } = textRef;
  const { y, height } = textRef.getBBox();
  const start = textContent.indexOf(text);
  const end = textContent.indexOf(text) + text.length - 1;
  const p1 = textRef.getStartPositionOfChar(start);
  const p2 = textRef.getEndPositionOfChar(end);
  return { x: p1.x, y, w: p2.x - p1.x, h: height };
}

export function Background(props) {
  const { line, textRef } = props;
  if (!line) {
    return null;
  }
  // recursively format background
  return Object.keys(line).map((key) => {
    const prop = line[key];
    if (typeof prop === "object" && prop.hasOwnProperty("nodeType")) {
      // prop is a node - check if it needs a background
      if (prop.children) {
        console.log(prop);
        // TODO process child backgrounds recursively - increase offset x y
        return prop.children.map((child) => (
          <Background textRef={textRef} line={child} />
        ));
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
}

export function FormatLine(props) {
  const { line } = props;
  const attributes = getAttributes(line && line.attributes);
  if (typeof line === "string") {
    return <tspan>{line}</tspan>;
  }
  return (
    <tspan>
      {attributes.map((attribute) => (
        <FormattedAttribute attribute={attribute[0]} value={attribute[1]} />
      ))}
      <FormattedLine line={line} />
    </tspan>
  );
}
