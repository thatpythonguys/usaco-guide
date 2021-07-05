import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import CodeBlock from '../markdown/CodeBlock/CodeBlock';
import Markdown from '../markdown/Markdown';

const GroupsCodeBlock = ({ language, value }) => {
  return <CodeBlock className={`language-${language}`}>{value}</CodeBlock>;
};

const renderers = {
  code: GroupsCodeBlock,
};

export default function SafeMarkdownRenderer({
  md,
  mdx,
}: {
  md: string;
  mdx?: string;
}): JSX.Element {
  return mdx ? (
    <Markdown body={mdx} />
  ) : (
    <div className="prose dark:prose-light max-w-none">
      <ReactMarkdown renderers={renderers} plugins={[gfm]} linkTarget="_blank">
        {md}
      </ReactMarkdown>
    </div>
  );
}
