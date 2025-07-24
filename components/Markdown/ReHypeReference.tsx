import { visit } from 'unist-util-visit'

export function rehypeReference() {
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /【.*?】/g;
      if (
        regex.test(node.value) &&
        !(parent?.type === 'element' && parent?.properties?.className?.includes('reference'))
      ) {
        const parts = node.value.split(regex);
        const matches = node.value.match(regex) || [];
        const newNodes = [];
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) {
            newNodes.push({ type: 'text', value: parts[i] });
          }
          if (i < matches.length) {
            // Remove the first and last character (【 and 】)
            let cleanText = matches[i].slice(1, -1);

            // Reformat citations like 5:0†b.pdf to b.pdf:0
            cleanText = cleanText.replace(/(\d+)(?::(\d+))?†([^\s]+)/g, (_m: string, _a: string, page: string, file: string) => {
                return page ? `${file}:${page}` : `${file}`;
            });

            newNodes.push({
              type: 'element',
              tagName: 'span',
              properties: { className: ['reference'] },
              children: [{ type: 'text', value: cleanText }]
            });
          }
        }
        if (parent && typeof index === 'number') {
          parent.children.splice(index, 1, ...newNodes);
        }
      }
    });
  }
}