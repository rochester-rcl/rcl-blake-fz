// Polygon scanline filling algorithm based on https://www.geeksforgeeks.org/scan-line-polygon-filling-using-opengl-c/
export function computeScanlineFill(points, nLines) {
  const [minHeight, maxHeight, p] = minMax(points, 1);
  const lineHeight = Math.ceil((maxHeight - minHeight) / nLines);
  const edgeTable = [];
  const activeEdgeTuple = {
    edgeBucketCount: 0,
    buckets: []
  };

  const lines = [];
  function initEdgeTable() {
    for (let i = 0; i < maxHeight; i++) {
      edgeTable[i] = {
        edgeBucketCount: 0,
        buckets: []
      };
    }
  }

  function addPointsToEdgeTable(points) {
    let p1, p2, i;
    for (i = 0; i < points.length; i++) {
      p1 = points[i];
      p2 = points[i + 1];
      if (i === points.length - 1) {
        p2 = points[0];
      }
      storeEdgeInTable(p1, p2);
    }
  }

  function sortEdges(et) {
    const temp = {};
    let j;
    for (let i = 1; i < et.edgeBucketCount; i++) {
      temp.yMax = et.buckets[i].yMax;
      temp.yMinX = et.buckets[i].yMinX;
      temp.slopeInverse = et.buckets[i].slopeInverse;
      j = i - 1;
      while (j >= 0 && temp.yMinX < et.buckets[j].yMinX) {
        if (et.buckets[j + 1] === undefined) {
          et.buckets[j + 1] = {};
        }
        et.buckets[j + 1].yMax = et.buckets[j].yMax;
        et.buckets[j + 1].yMinX = et.buckets[j].yMinX;
        et.buckets[j + 1].slopeInverse = et.buckets[j].slopeInverse;
        j = j - 1;
      }
      et.buckets[j + 1].yMax = temp.yMax;
      et.buckets[j + 1].yMinX = temp.yMinX;
      et.buckets[j + 1].slopeInverse = temp.slopeInverse;
    }
  }

  function storeEdgeInTuple(et, yMax, yMinX, slopeInverse) {
    if (!et) return;
    if (et.buckets[et.edgeBucketCount] === undefined) {
      et.buckets[et.edgeBucketCount] = {};
    }
    et.buckets[et.edgeBucketCount].yMax = yMax;
    et.buckets[et.edgeBucketCount].yMinX = yMinX;
    et.buckets[et.edgeBucketCount].slopeInverse = slopeInverse;
    sortEdges(et);
    et.edgeBucketCount++;
  }

  function storeEdgeInTable(p1, p2) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    let yMax, yMinX, scanline, slope, slopeInverse;
    if (x2 === x1) {
      slopeInverse = 0;
    } else {
      slope = (y2 - y1) / (x2 - x1);
      if (y2 === y1) return;
      slopeInverse = 1 / slope;
    }
    if (y1 > y2) {
      scanline = y2;
      yMax = y1;
      yMinX = x2;
    } else {
      scanline = y1;
      yMax = y2;
      yMinX = x1;
    }
    /*console.log(
      `slope: ${slope} | x1: ${x1} | x2: ${x2} | y1: ${y1} | y2: ${y2} | yMax: ${yMax} | yMinX: ${yMinX} | slopeInverse: ${slopeInverse} | scanline: ${scanline}`
    );*/
    storeEdgeInTuple(edgeTable[scanline], yMax, yMinX, slopeInverse);
  }

  function subsampleByLineHeight() {
    return lines.filter((line, idx) => idx % lineHeight === 0);
  }

  function removeEdgeByYMax(et, y) {
    for (let i = 0; i < et.edgeBucketCount; i++) {
      if (et.buckets[i].yMax === y) {
        for (let j = i; j < et.edgeBucketCount - 1; j++) {
          et.buckets[j].yMax = et.buckets[j + 1].yMax;
          et.buckets[j].yMinX = et.buckets[j + 1].yMinX;
          et.buckets[j].slopeInverse = et.buckets[j + 1].slopeInverse;
        }
        et.edgeBucketCount--;
        i--;
      }
    }
  }

  function updateXBySlopeInverse(et) {
    for (let i = 0; i < et.edgeBucketCount; i++) {
      et.buckets[i].yMinX = et.buckets[i].yMinX + et.buckets[i].slopeInverse;
    }
  }

  function scanlineFill() {
    let lineCount;
    let j, coordCount, x1, x2, yMax1, yMax2, fillFlag;
    for (let i = 0; i < maxHeight; i++) {
      for (let j = 0; j < edgeTable[i].edgeBucketCount; j++) {
        const { yMax, yMinX, slopeInverse } = edgeTable[i].buckets[j];
        storeEdgeInTuple(activeEdgeTuple, yMax, yMinX, slopeInverse);
      }
      removeEdgeByYMax(activeEdgeTuple, i);
      sortEdges(activeEdgeTuple);
      // TODO initialize above

      // fill flag in this case will add a path to an array of paths
      j = 0;
      x1 = 0;
      x2 = 0;
      yMax1 = 0;
      yMax2 = 0;
      coordCount = 0;
      fillFlag = false;
      while (j < activeEdgeTuple.edgeBucketCount) {
        if (coordCount % 2 === 0) {
          x1 = activeEdgeTuple.buckets[j].yMinX;
          yMax1 = activeEdgeTuple.buckets[j].yMax;
          if (x1 === x2) {
            if (
              (x1 === yMax1 && x2 !== yMax2) ||
              (x1 !== yMax1 && x2 === yMax2)
            ) {
              x2 = x1;
              yMax2 = yMax1;
            } else {
              coordCount++;
            }
          } else {
            coordCount++;
          }
        } else {
          x2 = activeEdgeTuple.buckets[j].yMinX;
          yMax2 = activeEdgeTuple.buckets[j].yMax;
          fillFlag = false;
          if (x1 === x2) {
            if (
              (x1 === yMax1 && x2 !== yMax2) ||
              (x1 !== yMax1 && x2 === yMax2)
            ) {
              x1 = x2;
              yMax1 = yMax2;
            } else {
              coordCount++;
              fillFlag = true;
            }
          } else {
            coordCount++;
            fillFlag = true;
          }
        }
        if (fillFlag) {
          // there's a bug somewhere up there ^ causing p1 === p2
          if (x1 !== x2) lines.push(`${x1},${i} ${x2},${i}`);
        }
        j++;
        lineCount++;
      }
    }
    updateXBySlopeInverse(activeEdgeTuple);
  }
  initEdgeTable();
  addPointsToEdgeTable(p);
  scanlineFill();
  const output = subsampleByLineHeight();
  return output;
}

function minMax(points, axis) {
  let min = Infinity;
  let max = 0;
  const p = points
    .split(" ")
    .map(point => point.split(",").map(p => parseInt(p, 10)));
  for (let i = 0; i < p.length; i++) {
    const val = p[i][axis];
    if (val < min) {
      min = val;
    }
    if (val > max) {
      max = val;
    }
  }
  return [min, max, p];
}

export function getLineHeight(points, nLines) {
  const [minHeight, maxHeight] = minMax(points, 1);
  return Math.ceil((maxHeight - minHeight) / nLines);
}
