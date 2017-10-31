/* @flow */

function xmlToJson(xml) {
	// Handshift and unclear as objects with #text instead of arrays of text
	
	// Create the return object
	var obj = {};
	if (xml.nodeType == 1) { // element
		// do attributes
		let nodeName = xml.nodeName;
		obj.nodeType = nodeName;
		if (xml.hasChildNodes()) {
			if (xml.attributes.length > 0) {
			obj["attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else {
			let nodeName = xml.nodeName;
			if (nodeName !== '#text') {
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
	} else if (xml.nodeType === 3) { // text
		obj = xml.nodeValue;
	}
	/* TODO change stage and diplomatic from { elementName: Array } to Array<Object(element)> */
	// do children
	if (xml.hasChildNodes()) {
		let stages = [];
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (nodeName === 'diplomatic') {
				let elements = [];
				if (item.hasChildNodes()) {
					item.childNodes.forEach((child) =>{
						elements.push(xmlToJson(child));
					});
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
			} else if (nodeName === 'stage') {
				let elements = [];
				if (item.hasChildNodes()) {
					item.childNodes.forEach((child) => {
						elements.push(xmlToJson(child));
					});
				}
				stages.push(elements);
				obj[nodeName] = stages;
			}
			else if (typeof(obj[nodeName]) === "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) === "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};


export function fetchXML(xmlPath) {
  return fetch(xmlPath).then((xml) => {
    return xml.text().then((xmlText) => {
      let parser = new DOMParser();
      let result = parser.parseFromString(xmlText, 'text/xml');
      let toJson = xmlToJson(result);
      return toJson;
    });
  });
}
