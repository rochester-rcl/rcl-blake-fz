/* @flow */

function getRawText(xml) {
  const getText = (node) => {
    let text = "";
    if (node.childNodes.length) {
      for (let n of node.childNodes) {
        if (n.nodeName === "#text") {
          text += n.textContent;
        } else {
          if (n.nodeName === "choice") {
            let orig = Array.from(n.childNodes).find(
              (c) => c.nodeName === "orig"
            );
            if (orig) {
              text += orig.textContent;
            }
          } else {
            text += getText(n);
          }
        }
      }
    } else {
      text += node.textContent;
    }
    return text;
  };
  return getText(xml);
}

function getTextPosition(xml, nodeKey, textKey) {
  let parent = xml.parentNode;
  let nodes = Array.from(parent.childNodes);
  let text = "";
  let textPosition = 0;
  for (let node of nodes) {
    if (node === xml) {
      textPosition = text.length;
    } else {
      if (node.nodeName === nodeKey) {
        let t = Array.from(node.childNodes).find((c) => c.nodeName === textKey);
        if (t) {
          text += t.textContent;
        }
      } else {
        text += node.textContent;
      }
    }
    // get text index based on all previous nodes
  }
  return textPosition;
}

function xmlToJson(xml) {
  // Handshift and unclear as objects with #text instead of arrays of text

  // Create the return object
  var obj = {};
  if (xml.nodeType === 1) {
    // element
    // do attributes
    let nodeName = xml.nodeName;
    obj.nodeType = nodeName;

    if (xml.hasChildNodes()) {
      if (nodeName === "handShift") {
        let elements = [];
        xml.childNodes.forEach((child) => {
          elements.push(xmlToJson(child));
        });
        obj[nodeName] = elements;
      }
      if (nodeName === "del") {
        let elements = [];
        xml.childNodes.forEach((child) => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "add") {
        let elements = [];
        xml.childNodes.forEach((child) => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "subst") {
        let elements = [];
        xml.childNodes.forEach((child) => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "hi") {
        obj.textPosition = getTextPosition(xml, nodeName, "#text");
      }
      if (nodeName === "choice") {
        obj.textPosition = getTextPosition(xml, nodeName, "orig");
      }
      if (nodeName === "zone") {
        // child zones get processed recursively in formatZone
        if (xml.parentNode.nodeName !== "zone") {
          formatZone(xml, obj);
        }
      } else if (xml.attributes.length > 0) {
        obj["attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
      if (nodeName !== "l") {
        obj.textPosition = getTextPosition(xml, nodeName, "#text");
      }
    } else {
      let nodeName = xml.nodeName;
      if (nodeName !== "#text") {
        let attributes = {};
        if (xml.attributes) {
          for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            attributes[attribute.nodeName] = attribute.nodeValue;
          }
        }
        obj[nodeName] = attributes;
      }
    }
  } else if (xml.nodeType === 3) {
    // text
    obj = xml.nodeValue;
  }
  // do children
  if (xml.hasChildNodes()) {
    let stages = [];
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (nodeName === "diplomatic") {
        let elements = [];
        if (item.hasChildNodes()) {
          item.childNodes.forEach((child) => {
            elements.push(xmlToJson(child));
          });
          if (item.attributes) {
            if (item.attributes.indent) {
              elements.unshift({ indent: item.attributes.indent.value });
            }
          }
        }
        obj[nodeName] = elements;
        if (item.attributes) {
          let attributes = {};
          for (var j = 0; j < item.attributes.length; j++) {
            var attribute = item.attributes.item(j);
            attributes[attribute.nodeName] = attribute.nodeValue;
          }
          obj[nodeName].attributes = attributes;
        }
      } else if (nodeName === "stage") {
        let elements = [];
        if (item.hasChildNodes()) {
          item.childNodes.forEach((child) => {
            let toJson = xmlToJson(child);
            elements.push(xmlToJson(child));
          });
        }
        if (item.attributes) {
          let attributes = {};
          for (var j = 0; j < item.attributes.length; j++) {
            var attribute = item.attributes.item(j);
            attributes[attribute.nodeName] = attribute.nodeValue;
          }
          elements.attributes = attributes;
        }
        stages.push(elements);
        obj[nodeName] = stages;
      } else if (typeof obj[nodeName] === "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push === "undefined") {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  if (obj.nodeType === "handShift") {
    let { handShift, ...handShiftProps } = obj;
    obj = handShiftProps;
    obj.nodeType = "handShift";
  }

  if (obj.nodeType === "zone" && obj.zone) {
    obj = obj.zone;
    obj.nodeType = "zone";
  }
  return obj;
}

function formatLineGroup(lg, parent, index) {
  let lineText = [];
  for (let child of lg.childNodes) {
    if (child.nodeName === "l") {
      lineText.push(getRawText(child));
    }
    if (child.nodeName === "handShift") {
      for (let c of child.childNodes) {
        if (c.nodeName === "l") {
          lineText.push(getRawText(c));
        }
      }
    }
  }

  let group = xmlToJson(lg);
  if (index > 0) {
    let vspace = parent
      .slice(0, index)
      .reverse()
      .find((child) => {
        return child.nodeName === "vspace";
      });
    if (vspace) {
      group.vspaceExtent = Number(xmlToJson(vspace).vspace.extent);
    } else {
      group.vspaceExtent = 0;
    }
  }
  if (group.handShift) {
    let { handShift } = group;
    let medium =
      (handShift.attributes && handShift.attributes.medium) || "pencil";
    group.l = Array.from(handShift.l).map((line, idx) => ({
      ...line,
      rawText: lineText[idx],
      medium,
    }));
  } else {
    group.l = Array.from(group.l).map((line, idx) => ({
      ...line,
      rawText: lineText[idx],
    }));
  }

  return group;
}

export function fetchXML(xmlPath) {
  return fetch(xmlPath).then((xml) => {
    return xml.text().then((xmlText) => {
      let parser = new DOMParser();
      let result = parser.parseFromString(xmlText, "text/xml");
      let toJson = xmlToJson(result);
      return toJson;
    });
  });
}

function formatZone(xml, obj) {
  let elements = [];
  const nodeName = "zone";
  obj[nodeName] = {};
  let lg = [];
  const zones = [];
  let columns;
  let textHead = null;
  if (xml.hasChildNodes()) {
    let children = Array.from(xml.childNodes);
    children.forEach((child, index) => {
      if (child.nodeName === "lg") {
        lg.push(formatLineGroup(child, children, index));
      }

      if (child.nodeName === "textfoot" && lg.length) {
        let textFoot = xmlToJson(child);
        let { l } = textFoot;
        if (l) {
          lg[lg.length - 1].l.push(textFoot.l);
        }
      }

      if (child.nodeName === "texthead") {
        let th = xmlToJson(child);
        if (
          th.l &&
          th.l["#text"] &&
          th.l["#text"].constructor.name === "Array" &&
          th.l["#text"].length === 2 &&
          th.l.physnumber
        ) {
          let thl = {
            ...th.l,
            ["#text"]: `${th.l["#text"][0]}${th.l.physnumber["#text"]}${th.l["#text"][1]}`,
          };
          delete thl.physnumber;
          th.l = thl;
          textHead = th;
        } else {
          textHead = th;
        }
      }

      if (child.nodeName === "columns") {
        let children = Array.from(child.childNodes);
        let cols = children.filter((col) => col.nodeName === "column");
        columns = cols.map((col) => {
          return {
            lineGroups: Array.from(col.children)
              .filter((child) => child.nodeName === "lg")
              .map((lg) => {
                return formatLineGroup(lg);
              }),
          };
        });
        if (child.attributes.orient !== undefined) {
          columns.orient = child.attributes.orient.value;
        }
      }
      if (child.nodeName === "zone") {
        const z = {};
        formatZone(child, z);
        const { zone } = z;
        zones.push(zone);
      }
      obj[nodeName].zones = zones;
    });
  }
  if (textHead && lg.length) {
    if (textHead.l) {
      lg[0].l.splice(0, 0, textHead.l);
    }
  }

  obj[nodeName].lg = lg;
  obj[nodeName].columns = columns;
  if (xml.attributes) {
    let attributes = {};
    for (var j = 0; j < xml.attributes.length; j++) {
      var attribute = xml.attributes.item(j);
      attributes[attribute.nodeName] = attribute.nodeValue;
    }
    obj[nodeName].attributes = attributes;
  }
}
