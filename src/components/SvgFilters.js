import React from "react";

export const Filters = {
  grayBackground: "gray-background",
};

export default function SvgFilters() {
  return (
    <defs>
      <filter x="0" y="0" width="1" height="1" id={Filters.grayBackground}>
        <feFlood flood-color="lightgray" result="bg" />
        <feMerge>
          <feMergeNode in="bg" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
