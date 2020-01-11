import * as React from "react";
import Breadcrumbs from "./breadcrumbs/Breadcrumbs";
import IAppProps from "./IAppProps";
import FileControls from "./fileControls/FileControls";

const App: React.FC<IAppProps> = ({ relPath, content, isDirectory, children }) => (
  <div>
    <Breadcrumbs relPath={relPath} />
    {!isDirectory && <FileControls relPath={relPath} content={content} />}
    {children}
  </div>
);

export default App;
