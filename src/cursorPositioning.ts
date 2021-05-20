export const getCursorPosition = (parent: HTMLElement) => {
  const selection = window.getSelection(),
    getAncestors = (el: HTMLElement) => {
      const ancestors = [];

      while (el.parentNode !== document) {
        ancestors.push(el.parentNode);

        el = el.parentNode as HTMLElement;
      }

      return ancestors;
    };

  if (selection === null) {
    return 0;
  }

  let position = -1,
    node;

  if (selection.focusNode) {
    if (
      getAncestors(selection.focusNode as HTMLElement).some(
        (node) => node === parent
      )
    ) {
      node = selection.focusNode;
      position = selection.focusOffset;

      while (node) {
        if (node === parent) {
          break;
        }

        if (node.previousSibling) {
          node = node.previousSibling;
          position += (node.textContent ?? '').length;
        } else {
          node = node.parentNode;

          if (!node) {
            break;
          }
        }
      }
    }
  }

  return position;
};

export const setCursorPosition = (el: HTMLElement, chars: number) => {
  const createRange = (
    node: Node,
    chars: { count: number },
    range: Range | null = null
  ): Range => {
    if (range === null) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node.textContent ?? '').length < chars.count) {
          chars.count -= (node.textContent ?? '').length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          range = createRange(node.childNodes[i], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }

    return range;
  };

  if (chars >= 0) {
    const selection = window.getSelection(),
      range = createRange(el, { count: chars });

    if (selection === null) {
      return;
    }

    if (range) {
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    }

    return false;
  }
};
