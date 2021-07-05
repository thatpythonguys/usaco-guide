import { xdm } from "../../gatsby/xdm.js";
import rehypeRaw from 'rehype-raw';
import remarkAutolinkHeadings from 'remark-autolink-headings';
import remarkExternalLinks from 'remark-external-links';
import remarkFrontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { remarkMdxFrontmatter } from 'remark-mdx-frontmatter';
import remarkSlug from 'remark-slug';
import customRehypeKatex from '../../mdx-plugins/rehype-math';
import rehypeSnippets from '../../mdx-plugins/rehype-snippets';

export async function compileXdm(source: String) {
  let result = await xdm.compile(source.replace(/<!--/g, '{/* ').replace(/-->/g, '*/}'), {
    remarkPlugins: [
      gfm,
      remarkMath,
      remarkFrontmatter,
      remarkMdxFrontmatter,
      remarkExternalLinks,
      remarkSlug,
      [
        remarkAutolinkHeadings,
        {
          linkProperties: {
            ariaHidden: 'true',
            tabIndex: -1,
            className: 'anchor before',
          },
          content: {
            type: 'mdxJsxFlowElement',
            name: 'HeaderLink',
          },
        },
      ],
    ],
    rehypePlugins: [
      [
        rehypeRaw,
        {
          passThrough: [
            'mdxjsEsm',
            'mdxFlowExpression',
            'mdxTextExpression',
            'mdxJsxFlowElement',
            'mdxJsxTextElement',
          ],
        },
      ],
      customRehypeKatex,
      rehypeSnippets,
    ],
    outputFormat: 'function-body',
  });
  const compiledResult = String(result);
  return compiledResult;
}


// const test = `

// # Hello World!

// <script>
//   console.log("A malicious script")
// </script>

// <h4>Hello World!</h4>

// <Spoiler test="hello">
//   asdf
// </Spoiler>

// `;

// (async () => {
//   console.log(await compileXdm(test));
// })();