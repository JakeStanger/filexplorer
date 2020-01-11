import * as React from "react";
import IFileControlsProps from "./IFileControlsProps";

const FileControls: React.FC<IFileControlsProps> = ({ relPath, content }) => (
  <div className={"file-controls"}>
    <div className={"control"}>
      <a href={relPath + "?raw"}>raw</a>
    </div>
    <div className={"control"}>
      <a href={relPath + "?download"}>download</a>
    </div>
    {content && (
      <div className={"control"}>
        <a className={"copy-btn"} href={"#"} data-clipboard-text={content}>
          copy
        </a>
      </div>
    )}
  </div>
);

export default FileControls;
