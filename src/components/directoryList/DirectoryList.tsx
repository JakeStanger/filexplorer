import * as React from "react";
import IDirectoryListProps from "./IDirectoryListProps";
import * as path from "path";
import { DateTime } from "luxon";

function bytesToSize(bytes) {
  const sizes = ["Bytes", "kB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Bytes";
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1000))));
  return (bytes / Math.pow(1000, i)).toPrecision(3) + " " + sizes[i];
}

const DirectoryList: React.FC<IDirectoryListProps> = ({
  relPath,
  contents
}) => (
  <div className={"table directory"}>
    <>
      <div className={"header"}>Name</div>
      <div className={"header"}>Size</div>
      <div className={"header"}>Created</div>
      <div className={"header"}>Modified</div>
    </>
    {contents.map(listing => (
      <React.Fragment key={listing.name}>
        <div>
          <a href={path.join(relPath, listing.name)}>{listing.name}</a>
        </div>
        <div>{!listing.isDirectory ? bytesToSize(listing.size) : "-"}</div>
        <div>{DateTime.fromJSDate(listing.created).toRelative()}</div>
        <div>{DateTime.fromJSDate(listing.modified).toRelative()}</div>
      </React.Fragment>
    ))}
  </div>
);

export default DirectoryList;
