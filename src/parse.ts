export type Style = {
  bg: string;
  fg: string;

  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  blink: boolean;
  overline: boolean;
  invert: boolean;
  hidden: boolean;
  strikethrough: boolean;
};

let currentStyle: Style = {
  bg: '49',
  fg: '39',
  bold: false, // \e[1m
  dim: false, // \e[2m
  italic: false, // \e[3m
  underline: false, // \e[4m
  blink: false, // \e[5m
  overline: false, // \e[6m
  invert: false, // \e[7m
  hidden: false, // \e[8m
  strikethrough: false, // \e[9m
};

export const defaultStyle: Style = {
  ...currentStyle,
};

export const parseStyles = (values: string): Style => {
  let newStyle: Style = {
    ...currentStyle,
  };

  values = values
    .replace(/\b48;5;(\d+)\b/, '48_5_$1')
    .replace(/\b38;5;(\d+)\b/, '38_5_$1')
    .replace(/\b48;2;(\d+);(\d+);(\d+)\b/, '48_2_$1_$2_$3')
    .replace(/\b38;2;(\d+);(\d+);(\d+)\b/, '38_2_$1_$2_$3');
  values.split(/;/).forEach((value) => {
    let match;

    if (value === '0') {
      newStyle = {
        ...defaultStyle,
      };
    }

    if (value === '1') {
      newStyle.bold = true;
    }

    if (value === '2') {
      newStyle.dim = true;
    }

    if (value === '3') {
      newStyle.italic = true;
    }

    if (value === '4') {
      newStyle.underline = true;
    }

    if (value === '5') {
      newStyle.blink = true;
    }

    if (value === '6') {
      newStyle.overline = true;
    }

    if (value === '7') {
      newStyle.invert = true;
    }

    if (value === '8') {
      newStyle.hidden = true;
    }

    if (value === '9') {
      newStyle.strikethrough = true;
    }

    if (value === '21') {
      newStyle.bold = false;
    }

    if (value === '22') {
      newStyle.dim = false;
    }

    if (value === '23') {
      newStyle.italic = false;
    }

    if (value === '24') {
      newStyle.underline = false;
    }

    if (value === '25') {
      newStyle.blink = false;
    }

    if (value === '26') {
      newStyle.overline = false;
    }

    if (value === '27') {
      newStyle.invert = false;
    }

    if (value === '28') {
      newStyle.hidden = false;
    }

    if (value === '29') {
      newStyle.strikethrough = false;
    }

    if ((match = value.match(/^38_2_(\d+)_(\d+)_(\d+)$/))) {
      newStyle.fg = simplifyColour('true-' + match.slice(1).join('-'));
    } else if ((match = value.match(/^38_5_(\d+)$/))) {
      newStyle.fg = simplifyColour('256-' + match[1]);
    } else if ((match = value.match(/^(3|9)[0-79]$/))) {
      newStyle.fg = value;
    }

    if ((match = value.match(/^^48_2_(\d+)_(\d+)_(\d+)$/))) {
      newStyle.bg = simplifyColour('true-' + match.slice(1).join('-'), true);
    } else if ((match = value.match(/^48_5_(\d+)$/))) {
      newStyle.bg = simplifyColour('256-' + match[1], true);
    } else if ((match = value.match(/^(4|10)[0-79]$/))) {
      newStyle.bg = value;
    }
  });

  return newStyle;
};

export const simplifyColour = (colour: string, bg: boolean = false): string => {
  const prefix = bg ? '4' : '3',
    brightPrefix = bg ? '10' : '9';

  let match;

  if ((match = colour.match(/^true-(\d+)-(\d+)-(\d+)/))) {
    if (
      (match = rgbToTerm256(
        [
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
        ],
        true
      ))
    ) {
      colour = '256-' + match;
    }
  }

  if ((match = colour.match(/^256-(\d+)/))) {
    if (parseInt(match[1], 10) < 16) {
      if (parseInt(match[1], 10) < 8) {
        colour = prefix + match[1];
      } else {
        colour = brightPrefix + (parseInt(match[1], 10) % 8);
      }
    } else if (match[1] === '16') {
      colour = prefix + '0';
    } else if (match[1] === '231') {
      colour = brightPrefix + '7';
    }
  }

  return colour;
};

export const buildStyles = (style: Style) => {
  let styleString = '\\e[';

  (
    [
      { key: 'bg', n: 48 },
      { key: 'fg', n: 38 },
    ] as { key: 'fg' | 'bg'; n: number }[]
  ).forEach((obj) => {
    let match;

    if ((match = style[obj.key].match(/true-(\d+)-(\d+)-(\d+)/))) {
      styleString += obj.n + ';2;' + match.slice(1).join(';') + ';';
    } else if ((match = style[obj.key].match(/256-(\d+)/))) {
      styleString += obj.n + ';5;' + match[1] + ';';
    } else if (style[obj.key]) {
      styleString += style[obj.key] + ';';
    }
  });

  (
    [
      'bold',
      'dim',
      'italic',
      'underline',
      'blink',
      'overline',
      'invert',
      'hidden',
      'strikethrough',
    ] as (keyof Style)[]
  ).forEach((property, i) => {
    if (style[property]) {
      styleString += ++i + ';';
    }
  });

  styleString = styleString.replace(/;$/, '');

  return styleString + 'm';
};

export type StyleType = {
  content: string;
  style?: Style;
  type: string;
  value: string;
  wrap: boolean;
};

export const extract = (string: string): StyleType[] => {
  const patterns = {
      stylingReset: /^(?:\\\[)?(?:\\033|\\e|\\x1[bB]|\x1b)\[(0?)m(?:\\])?/,
      styling: /^(?:\\\[)?(?:\\033|\\e|\\x1[bB]|\x1b)\[([^m]*)m(?:\\])?/,
      command: /^(?:\\\[)?(?:\\?`([^`]+)\\?`|\\?\$\(([^)]+)\))(?:\\])?/,
      octal: /^\\(\d{3})/,
      hex: /^\\x([0-9a-fA-F]{2})/,
      token: /^( |\\[!#$@\\0aAdehHjlnsTtuvVWw])/,
      variable: /^\${?(\w+|\?)}?/,
      text: /^([\S\s])/,
    },
    data: StyleType[] = [];

  let match, last, matched: boolean;

  while (string) {
    matched = false;

    Object.entries(patterns).forEach(([type, pattern]) => {
      if (!matched && (match = string.match(pattern))) {
        matched = true;

        if (
          type === 'text' &&
          data.length &&
          (last = data[data.length - 1]).type === 'text'
        ) {
          last.content += match[0];
          last.value += match[0];
        } else if (type === 'command') {
          data.push({
            type: type,
            content: match[0],
            value: match[1] || match[2] || '',
            wrap: !!(match[0].match(/^\\\[/) && match[0].match(/\\]$/)),
          });
        } else {
          data.push({
            type: type,
            content: match[0],
            value: match[1],
            wrap: !!(match[0].match(/^\\\[/) && match[0].match(/\\]$/)),
          });
        }

        string = string.replace(pattern, '');
      }
    });
  }

  return data;
};

export const process = (data: StyleType[]): string => {
  let code = '',
    getStyle = (): string => {
      const classes = [];

      if (currentStyle.invert) {
        classes.push('bg-' + currentStyle.fg);
        classes.push('fg-' + currentStyle.bg);
      } else {
        classes.push('bg-' + currentStyle.bg);
        classes.push('fg-' + currentStyle.fg);
      }

      (
        [
          'bold',
          'dim',
          'italic',
          'underline',
          'overline',
          'strikethrough',
          'blink',
          'hidden',
        ] as (keyof Style)[]
      ).forEach((key) => {
        if (currentStyle[key]) {
          classes.push(key);
        }
      });

      return ' ' + classes.join(' ');
    };

  currentStyle = {
    ...defaultStyle,
  };

  data.forEach((block) => {
    const escape = (s: string): string => (s || '').replace(/"/g, '&quot;');

    if (block.type.match(/styling/)) {
      if (code.match(/<span class="block styling/)) {
        code += '</span>';
      }

      block.style = parseStyles(block.value);

      currentStyle = {
        ...currentStyle,
        ...block.style,
      };

      code +=
        '<span class="block styling' +
        getStyle() +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(block.value) +
        '" data-type="' +
        block.type +
        '" style="' +
        ((block.style.fg + '').match(/true-/)
          ? (block.style.fg + '')
              .replace(/true-/, 'color: rgb(')
              .replace(/$/, ');')
              .replace(/\-/g, ',')
          : '') +
        ((block.style.bg + '').match(/true-/)
          ? (block.style.bg + '')
              .replace(/\-/g, ',')
              .replace(/true,/, 'background-color: rgb(')
              .replace(/$/, ')')
          : '') +
        '"><span class="content">' +
        block.content +
        '</span>';
    } else if (block.type === 'command') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(block.value) +
        '"><span class="content">' +
        (block.wrap ? '<span class="wrap">\\[</span>' : '') +
        '$(' +
        block.value +
        ')' +
        (block.wrap ? '<span class="wrap">\\]</span>' : '') +
        '</span></span>';
    } else if (block.type === 'token') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(block.value) +
        '" data-type="' +
        block.type +
        '"><span class="content">' +
        block.content +
        '</span></span>';
    } else if (block.type === 'text') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(block.value) +
        '" data-type="' +
        block.type +
        '">' +
        block.content +
        '</span>';
    } else if (block.type === 'variable') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(block.value) +
        '" data-type="' +
        block.type +
        '"><span class="content">' +
        block.content +
        '</span></span>';
    } else if (block.type === 'hex') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(String.fromCharCode(parseInt(block.value, 16))) +
        '" data-type="' +
        block.type +
        '"><span class="content">' +
        block.content +
        '</span></span>';
    } else if (block.type === 'octal') {
      code +=
        '<span class="block ' +
        block.type +
        '" data-content="' +
        escape(block.content) +
        '" data-value="' +
        escape(String.fromCharCode(parseInt(block.value, 8))) +
        '" data-type="' +
        block.type +
        '"><span class="content">' +
        block.content +
        '</span></span>';
    }
  });

  code += '<span class="cursor"></span>';

  if (code.match(/<span class="block styling/)) {
    code += '</span>';
  }

  return code;
};

export const parse = (string: string): string => {
  return process(extract(string));
};

export type Colour = [number, number, number];

export type TermColour = [...Colour, number];

// store out here to build once and re-use
export const colours = (() => {
  const colours: TermColour[] = [];

  colours.push([0, 0, 0, 0]);
  colours.push([128, 0, 0, 1]);
  colours.push([0, 128, 0, 2]);
  colours.push([128, 128, 0, 3]);
  colours.push([0, 0, 128, 4]);
  colours.push([128, 0, 128, 5]);
  colours.push([0, 128, 128, 6]);
  colours.push([192, 192, 192, 7]);
  colours.push([128, 128, 128, 8]);
  colours.push([255, 0, 0, 9]);
  colours.push([0, 255, 0, 10]);
  colours.push([255, 255, 0, 11]);
  colours.push([0, 0, 255, 12]);
  colours.push([255, 0, 255, 13]);
  colours.push([0, 255, 255, 14]);
  colours.push([255, 255, 255, 15]);

  [0, 95, 135, 175, 215, 255].forEach((r) => {
    [0, 95, 135, 175, 215, 255].forEach((g) => {
      [0, 95, 135, 175, 215, 255].forEach((b) => {
        colours.push([
          r,
          g,
          b,
          16 +
            parseInt(
              '' +
                Math.floor((r / 255) * 5) +
                Math.floor((g / 255) * 5) +
                Math.floor((b / 255) * 5),
              6
            ),
        ]);
      });
    });
  });

  [
    8, 18, 28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128, 138, 148, 158, 168,
    178, 188, 198, 208, 218, 228, 238,
  ].forEach((s) => {
    colours.push([s, s, s, 232 + Math.floor(s / 10)]);
  });

  return colours;
})();

export const getClosest = (candidates: TermColour[], source: Colour) =>
  candidates.slice(0).sort(
    (x, y) =>
      Math.abs(x[0] - source[0]) +
        Math.abs(x[1] - source[1]) +
        Math.abs(x[2] - source[2]) -
        (Math.abs(y[0] - source[0]) +
          Math.abs(y[1] - source[1]) +
          Math.abs(y[2] - source[2])) || x[3] - y[3] // prefer lower colour numbers
  )[0];

export const rgbToTerm16 = (rgb: Colour, bg: boolean = false) =>
  simplifyColour('256-' + (getClosest(colours.slice(0, 16), rgb) || [])[3], bg);

export const rgbToTerm256 = (
  rgb: Colour,
  exact: boolean = false
): number | null => {
  if (exact) {
    const colour =
      colours.filter((colour) => {
        return (
          colour[0] === rgb[0] && colour[1] === rgb[1] && colour[2] === rgb[2]
        );
      })[0] || [];

    return colour[3] ?? null;
  }

  return (getClosest(colours, rgb) || [])[3] ?? null;
};

export const term16ToRgb = (id: number): Colour => {
  let colour;

  // TODO: defaults based on selected option?
  if (id === 49) {
    colour = colours[0];
  } else if (id === 39) {
    colour = colours[7];
  }
  // normal
  else if (id < 50) {
    colour = colours[id % 10];
  }
  // bright
  else {
    colour = colours[(id % 10) + 8];
  }

  return [colour[0], colour[1], colour[2]];
};

export const term256ToRgb = (id: number): Colour | null => {
  let value = null;

  if (colours[id][3] === id) {
    return [colours[id][0], colours[id][1], colours[id][2]];
  }

  colours.forEach((colour): void => {
    if (colour[3] === id) {
      value = [colour[0], colour[1], colour[2]];
    }
  });

  return value;
};

export const hexToRgb = (hex: string): Colour => {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  } else if (hex.length === 6) {
    return [
      parseInt(hex[0] + hex[1], 16),
      parseInt(hex[2] + hex[3], 16),
      parseInt(hex[4] + hex[5], 16),
    ];
  }

  return [0, 0, 0];
};

export const rgbToHex = (rgb: Colour): string =>
  `#${rgb.map((n) => (0 + n.toString(16)).substr(-2)).join('')}`;

export default parse;
