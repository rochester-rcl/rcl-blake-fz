/* @flow */

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
        xml.childNodes.forEach(child => {
          elements.push(xmlToJson(child));
        });
        obj[nodeName] = elements;
      }
      if (nodeName === "del") {
        let elements = [];
        xml.childNodes.forEach(child => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "add") {
        let elements = [];
        xml.childNodes.forEach(child => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "subst") {
        let elements = [];
        xml.childNodes.forEach(child => {
          elements.push(xmlToJson(child));
        });
        obj["children"] = elements;
      }
      if (nodeName === "zone") {
        formatZone(xml, obj);
      } else if (xml.attributes.length > 0) {
        obj["attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["attributes"][attribute.nodeName] = attribute.nodeValue;
        }
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
          item.childNodes.forEach(child => {
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
          item.childNodes.forEach(child => {
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
    obj = obj.handShift;
    obj.nodeType = "handShift";
  }

  if (obj.nodeType === "zone") {
    obj = obj.zone;
    obj.nodeType = "zone";
  }
  return obj;
}

function formatLineGroup(lg, parent, index) {
  let group = xmlToJson(lg);
  if (index > 0) {
    let vspace = parent
      .slice(0, index)
      .reverse()
      .find(child => {
        return child.nodeName === "vspace";
      });
    if (vspace) {
      group.vspaceExtent = Number(xmlToJson(vspace).vspace.extent);
    } else {
      group.vspaceExtent = 0;
    }
  }
  return group;
}

export function fetchXML(xmlPath) {
  return fetch(xmlPath).then(xml => {
    return xml.text().then(xmlText => {
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
  let lg = [];
  const zones = [];
  let columns;
  if (xml.hasChildNodes()) {
    let children = Array.from(xml.childNodes);
    children.forEach((child, index) => {
      if (child.nodeName === "lg") {
        lg.push(formatLineGroup(child, children, index));
      }

      if (child.nodeName === "columns") {
        let children = Array.from(child.childNodes);
        let cols = children.filter(col => col.nodeName === "column");
        columns = cols.map(col => {
          return {
            lineGroups: Array.from(col.children)
              .filter(child => child.nodeName === "lg")
              .map(lg => {
                return formatLineGroup(lg);
              })
          };
        });
        if (child.attributes.orient !== undefined) {
          columns.orient = child.attributes.orient.value;
        }
      }
      if (child.nodeName === "zone") {
        const zone = {};
        formatZone(child, zone);
        zones.push(zone);
      }
    });
  }
  obj[nodeName] = {};
  obj[nodeName].lg = lg;
  obj[nodeName].columns = columns;
  obj[nodeName].zones = zones;
  if (xml.attributes) {
    let attributes = {};
    for (var j = 0; j < xml.attributes.length; j++) {
      var attribute = xml.attributes.item(j);
      attributes[attribute.nodeName] = attribute.nodeValue;
    }
    obj[nodeName].attributes = attributes;
  }
}
