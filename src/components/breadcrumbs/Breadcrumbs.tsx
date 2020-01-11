import * as React from "react";
import IBreadCrumbsProps from "./IBreadCrumbsProps";

const Breadcrumbs: React.FC<IBreadCrumbsProps> = ({ relPath }) => {
  const pathSplit = relPath.split('/');

  return (
    <div className={"breadcrumbs"}>
      <div className={"crumb"}>
        <a href={"/"}>/</a>
      </div>
      {pathSplit.map((section, i) => (
        <div className={"crumb"} key={i}>
          <a href={pathSplit.slice(0, i+1).join('/')}>{section}</a>
        </div>
      ))}
    </div>
  );
};

export default Breadcrumbs;
