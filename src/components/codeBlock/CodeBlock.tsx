import * as React from "react";
import SyntaxHighlighter, {
  SyntaxHighlighterProps
} from "react-syntax-highlighter";
import lightTheme from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-light";
import ICodeBlockProps from "./ICodeBlockProps";

lightTheme["hljs-selection"] = {
  backgroundColor: "#ebebeb" // https://github.com/atom/one-light-ui/blob/master/styles/ui-variables.less#L32
};

const CodeBlock: React.FC<ICodeBlockProps> = ({ content, language, value }) => (
  <SyntaxHighlighter
    style={lightTheme}
    language={language}
    showLineNumbers={(content || value).split('\n').length > 5}
    wrapLines={true}
  >
    {content || value}
  </SyntaxHighlighter>
);

export default CodeBlock;