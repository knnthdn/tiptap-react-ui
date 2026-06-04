import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, PluginKey } from "prosemirror-state";
import { Node as ProseMirrorNode } from "prosemirror-model";
import type { Root, RootContent, Element } from "hast";

// --- Lowlight type (REAL) ---
type Lowlight = {
  highlight: (language: string, value: string) => Root;
  highlightAuto: (value: string) => Root;
  listLanguages: () => string[];
};

type ParsedNode = {
  text: string;
  classes: string[];
};

const CODE_MARK_TYPE = "code";

// --- Parse HAST properly ---
function parseNodes(
  nodes: RootContent[],
  className: string[] = [],
): ParsedNode[] {
  return nodes.flatMap((node) => {
    // TEXT NODE
    if (node.type === "text") {
      return [
        {
          text: node.value,
          classes: className,
        },
      ];
    }

    // ELEMENT NODE
    if (node.type === "element") {
      const el = node as Element;

      const classList = el.properties?.className;

      const normalizedClasses = Array.isArray(classList)
        ? classList.map((c) => String(c))
        : typeof classList === "string" || typeof classList === "number"
          ? [String(classList)]
          : [];

      const classes = [...className, ...normalizedClasses];

      return parseNodes(el.children, classes);
    }

    // Ignore comments, doctypes, etc.
    return [];
  });
}

function findInlineCode(
  doc: ProseMirrorNode,
  markType: string,
): { from: number; to: number; text: string }[] {
  const result: { from: number; to: number; text: string }[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return true;

    node.marks.forEach((mark) => {
      if (mark.type.name === markType) {
        result.push({
          from: pos,
          to: pos + node.nodeSize,
          text: node.text ?? "",
        });
      }
    });

    return true;
  });

  return result;
}

function getDecorations({
  doc,
  lowlight,
}: {
  doc: ProseMirrorNode;
  lowlight: Lowlight;
}): DecorationSet {
  const decorations: Decoration[] = [];

  const blocks = findInlineCode(doc, CODE_MARK_TYPE);

  blocks.forEach((block) => {
    let from = block.from;

    const tree = lowlight.highlightAuto(block.text);

    const parsed = parseNodes(tree.children);

    parsed.forEach((node) => {
      const length = node.text.length;
      if (length === 0) return;

      const to = from + length;

      if (node.classes.length > 0) {
        decorations.push(
          Decoration.inline(from, to, {
            class: node.classes.join(" "),
          }),
        );
      }

      from = to;
    });
  });

  return DecorationSet.create(doc, decorations);
}

// --- Extension ---
export const CodeInlineLowlight = Extension.create<{
  lowlight: Lowlight;
}>({
  name: "codeInlineLowlight",

  addOptions() {
    return {
      lowlight: {} as Lowlight,
    };
  },

  addProseMirrorPlugins() {
    const lowlight = this.options.lowlight;

    if (
      !lowlight ||
      typeof lowlight.highlight !== "function" ||
      typeof lowlight.highlightAuto !== "function"
    ) {
      console.warn("Invalid lowlight instance");
      return [];
    }

    const pluginKey = new PluginKey<DecorationSet>(this.name);

    return [
      new Plugin<DecorationSet>({
        key: pluginKey,

        state: {
          init: (_, { doc }) =>
            getDecorations({
              doc,
              lowlight,
            }),

          apply: (tr, set) => {
            if (!tr.docChanged) {
              return set.map(tr.mapping, tr.doc);
            }

            return getDecorations({
              doc: tr.doc,
              lowlight,
            });
          },
        },

        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
