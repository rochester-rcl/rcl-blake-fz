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
  const { textRef, line } = props;
  const { gap } = line;
  const extent = parseInt(gap.extent, 10) || "1";
  const size = textRef ? textRef.getExtentOfChar(`\xa0`).width : 0;
  const text = line["#text"];
  if (text) {
    if (text.constructor === Array && text.length === 2) {
      return (
        <tspan>
          <tspan>{text[0]}</tspan>
          <tspan textDecoration="line-through">
            <Space n={extent} direction="horizontal" size={size} />
          </tspan>
          <tspan>{text[1]}</tspan>
        </tspan>
      );
    }
    return (
      <tspan>
        <tspan>{text}</tspan>
        <tspan textDecoration="line-through">
          <Space n={extent} direction="horizontal" size={size} />
        </tspan>
      </tspan>
    );
  }
  return (
    <tspan textDecoration="line-through">
      <Space n={extent} direction="horizontal" size={size} />
    </tspan>
  );
}

export function Subst(props) {
  const { textRef, line } = props;
  const { subst } = line;
  if (line["#text"].constructor === Array) {
    if (subst.children) {
      // collect all del / add combinations as tuples
      let { children } = subst;
      let substChildren = children.reduce((substChildren, child, idx) => {
        if (child.nodeType === "del") {
          substChildren.push([child, children[idx + 1] || null]);
        }
        return substChildren;
      }, []);

      const renderSubst = (substTup, previousText) => {
        const l = { ...subst, del: substTup[0], add: substTup[1] };

        return (
          <tspan key="subst-children">
            <Del key="subst-del" line={l} textRef={textRef} />
            <Add key="subst-add" line={l} textRef={textRef} />
          </tspan>
        );
      };
      return line["#text"].map((text, idx) => (
        <tspan key={`subst-${idx}`}>
          <tspan key="subst-text">{text}</tspan>
          {substChildren[idx] ? renderSubst(substChildren[idx], text) : null}
        </tspan>
      ));
    }
  }
  // not sure if there's ever a scenario where a subst isnt' formatted like the above ^ - not implementing for now.
  return null;
}

export function Choice(props) {
  const { line } = props;
  const { choice } = line;
  function formatTextWithChoice(text, choice) {
    let finalText = text;
    function formatChoiceText(ch, t) {
      return ch.textPosition !== undefined
        ? [
            t.slice(0, ch.textPosition),
            (ch.orig && ch.orig["#text"]) || "",
            t.slice(ch.textPosition, t.length),
          ].join("")
        : "";
    }
    if (choice.length) {
      finalText = choice.reduce((a, b) => formatChoiceText(b, a), finalText);
    } else {
      finalText = formatChoiceText(choice, finalText);
    }
    return (
      <tspan key="key2">
        <tspan>{finalText}</tspan>
      </tspan>
    );
  }
  if (line["#text"]) {
    return line["#text"].constructor === Array
      ? formatTextWithChoice(line["#text"].join(""), choice)
      : formatTextWithChoice(line["#text"], choice);
  } else {
    return formatTextWithChoice("", choice);
  }
}

export function Catchword(props) {
  const { line, textRef } = props;
  console.log(textRef);
  return <tspan>{line.catchword ? line.catchword["#text"] : ""}</tspan>;
}

export function Hi(props) {
  const { line } = props;
  const { hi } = line;
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

  if (!line["#text"]) {
    return null;
  }

  let rawText =
    line["#text"].constructor === Array
      ? line["#text"].join("")
      : line["#text"];
  let { textPosition } = line.hi;
  let pre = rawText.slice(0, textPosition);
  let post = rawText.slice(textPosition);
  return (
    <tspan>
      <tspan key={pre}>{pre}</tspan>
      {renderHi(line.hi["#text"])}
      <tspan key={post}>{post}</tspan>
    </tspan>
  );
}
export function Add(props) {
  const { line } = props;
  const { add } = line;
  if (add.attributes && add.attributes.place === "supralinear") {
    return (
      <tspan baselineShift="super" fill={TextColors.add}>
        {add["#text"]}
      </tspan>
    );
  }

  let text = line["#text"];
  if (text && text.constructor === Array && text.length === 2) {
    return (
      <tspan>
        <tspan>{text[0]}</tspan>
        <tspan fill={TextColors.add}>{add["#text"]}</tspan>
        <tspan>{[text[1]]}</tspan>
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
  const { textRef, line } = props;
  const { del } = line;
  const delType = del.attributes ? del.attributes.type : DelTypes.overwrite;

  let lineText = line["#text"];

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
  if (lineText) {
    if (lineText.constructor === Array && lineText.length === 2) {
      return (
        <tspan>
          <tspan>{lineText[0]}</tspan>
          {formatDel()}
          <tspan>{lineText[1]}</tspan>
        </tspan>
      );
    }
    return (
      <tspan>
        <tspan>{lineText}</tspan>
        {formatDel()}
      </tspan>
    );
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

function FormattedLine(props) {
  const { line, textRef } = props;
  if (!line) {
    return null;
  }
  const text = line["#text"] || "";
  const l = [];
  for (const key in line) {
    if (key === "del") {
      l.push(<Del key={shortid.generate()} line={line} textRef={textRef} />);
    }
    // TODO fix inline add
    if (key === "add") {
      l.push(<Add line={line} textRef={textRef} />);
    }
    if (key === "gap") {
      l.push(<Gap line={line} textRef={textRef} />);
    }
    if (key === "subst") {
      l.push(<Subst line={line} textRef={textRef} />);
    }
    if (key === "hi") {
      l.push(<Hi line={line} textRef={textRef} />);
    }
    if (key === "choice") {
      l.push(<Choice line={line} textRef={textRef} />);
    }
    if (key === "catchword") {
      l.push(<Catchword line={line} textRef={textRef} />);
    }
  }

  return l.length ? <>{l}</> : <tspan>{text}</tspan>;
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
  const { line, textRef } = props;
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
      <FormattedLine line={line} textRef={textRef} />
    </tspan>
  );
}
