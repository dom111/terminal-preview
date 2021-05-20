import parse from './parse';
import { getCursorPosition, setCursorPosition } from './cursorPositioning';

export const bind = (el: HTMLElement) => {
  const update = () => {
    el.classList.add('mutating');

    const newContent = parse(el.innerText);

    if (el.innerHTML !== newContent) {
      const position = getCursorPosition(el);

      el.innerHTML = newContent;

      setCursorPosition(el, position);
    }

    requestAnimationFrame(() => el.classList.remove('mutating'));
  };

  if (el.classList.contains('mutating')) {
    return;
  }

  if (!el.classList.contains('change-event-bound')) {
    el.addEventListener('input', () => update());

    el.classList.add('change-event-bound');
  }

  update();
};

export const observer = new MutationObserver((mutationsList): void => {
  for (const { target } of mutationsList) {
    if (!(target instanceof HTMLElement)) {
      continue;
    }

    const childTerminals = target.querySelectorAll('.terminal');

    if (childTerminals.length) {
      childTerminals.forEach((el) => bind(el as HTMLElement));

      continue;
    }

    if (target.matches('.terminal')) {
      bind(target);
    }
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});

document.querySelectorAll('.terminal').forEach((el) => bind(el as HTMLElement));

export default bind;
