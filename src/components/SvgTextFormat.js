import React from "react";

export function Space(props) {
  const { n, direction } = props;
  const spaceChar = `\xa0`;
  if (direction === "horizontal") {
    return <tspan dx={`${n}em`}>{spaceChar}</tspan>;
  } else {
    return <tspan dy={`${n}em`}>{spaceChar}</tspan>;
  }
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

function getAttributes(attributes) {
  return attributes
    ? Object.keys(attributes).map((key) => [key, attributes[key]])
    : [];
}

export function FormatLine(props) {
  const { line } = props;
  const text = line ? line["#text"] : "";
  const attributes = getAttributes(line && line.attributes);
  return (
    <tspan>
      {attributes.map((attribute) => (
        <FormattedAttribute attribute={attribute[0]} value={attribute[1]} />
      ))}
      {text}
    </tspan>
  );
}
