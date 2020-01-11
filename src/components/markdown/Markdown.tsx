import * as React from "react";
import * as ReactMarkdown from "react-markdown";
import IMarkdownProps from "./IMarkdownProps";
import CodeBlock from "../codeBlock/CodeBlock";

const Markdown: React.FC<IMarkdownProps> = ({ content }) => (
  <ReactMarkdown source={content} renderers={{ code: CodeBlock }} />
);

export default Markdown;
