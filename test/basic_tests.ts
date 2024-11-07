import Helper from "../helpers";

let H = Helper;

class MockEditor {
  lines: string[];
  cursor: MockCursor;
  constructor(lines: string[], current_line: number) {
    this.lines = lines;
    this.cursor = new MockCursor(current_line);
  }
  getCursor() {
    return this.cursor;
  }
  getLine(n: number) {
    return this.lines[n];
  }

  lineCount() {
    return this.lines.length;
  }
}

class MockCursor {
  line: number;
  constructor(n: number) {
    this.line = n;
  }

}

function getEditor(lines: string[], current_line: number) {
  return new MockEditor(lines, current_line);
}

describe('testing determining the nesting level', () => {
  test('zero nesting level', () => {
    expect(Helper.getNestingLevel("- [ ] ")).toBe(0);
  });

  test('one nesting level', () => {
    expect(Helper.getNestingLevel("\t- [ ] ")).toBe(1);
  });

  test('two nesting levels', () => {
    expect(Helper.getNestingLevel("\t\t- [ ] ")).toBe(2);
  });

  test('blank lines ahead of task - no nesting', () => {
    expect(Helper.getNestingLevel("\n\n\n- [ ] ")).toBe(0);
  });

  test('blank lines ahead of task - one level o fnesting', () => {
    expect(Helper.getNestingLevel("\n\n\n\t- [ ] ")).toBe(1);
  });
});

describe('testing the random digit creation', () => {
  test('3 digit string is length three', () => {
    expect(H.generateRandomDigits(3).length).toBe(3);
  })

  test('6 digit string is length three', () => {
    expect(H.generateRandomDigits(6).length).toBe(6);
  })

  test('string just contains digits', () => {
    let result = H.generateRandomDigits(200);
    let r = new RegExp('^[0123456789]+$')
    expect(r.test(result)).toBeTruthy();
  })

})

describe('testing the generation of a prefix from a string', () => {
  test('single word is just replicated', () => {
    expect(H.getPrefixFromString("Test", false, false)).toBe("Test");
  })

  test('multiple words remove spaces', () => {
    expect(H.getPrefixFromString("Test This", false, false)).toBe("TestThis");
  })

  test('multiple words lower case the letters', () => {
    expect(H.getPrefixFromString("test this", false, false)).toBe("TestThis");
  })

  test('remove any tags from text', () => {
    expect(H.getPrefixFromString("test #this", false, false)).toBe("TestThis");
  })

  test('multiple words first letters', () => {
    expect(H.getPrefixFromString("test this please", true, false)).toBe("TTP");
  })

  test('multiple words first letters tags', () => {
    expect(H.getPrefixFromString("test #this please", true, false)).toBe("TTP");
  })

  test('multiple words remove vowels', () => {
    expect(H.getPrefixFromString("test this please", false, true)).toBe("TstThsPls");
  })

  test('multiple words, first letters keep lower case vowels', () => {
    expect(H.getPrefixFromString("test only this please", true, true)).toBe("TOTP");
  })

  test('multiple words, first letters keep upper case vowels', () => {
    expect(H.getPrefixFromString("Test Only This Please", true, true)).toBe("TOTP");
  })
})

describe('testing of clearing of the block ID\'s from some text', () => {
  for (let char of ['🆔', '⛔']) {
    test(`clear ${char} block IDs end of line`, () => {
      expect(H.clearBlockIDs(`This ${char} Hello`, 'tag')).toBe('This');
    })

    test(`clear ${char} block IDs beginning of line`, () => {
      expect(H.clearBlockIDs(`${char} Hello there`, 'tag')).toBe('there');
    })

    test(`clear ${char} block IDs middle of line`, () => {
      expect(H.clearBlockIDs(`I said ${char} Hello there`, 'tag')).toBe('I saidthere');
    })

    test(`clear ${char} block IDs with numbers`, () => {
      expect(H.clearBlockIDs(`This ${char} Hello123 there`, 'tag')).toBe('Thisthere');
    })
  }

  test('clear blocker and ID with numbers', () => {
    expect(H.clearBlockIDs('This 🆔 Hello123 ⛔ Hello123 there', 'tag')).toBe('Thisthere');
  })
})

describe('testing of clearing tags from tasks', () => {
  test('leave tags on non task lines', () => {
    expect(H.clearBlockIDs('Some #tag\nIn some lines\nwith the #tag there', 'tag')).toBe(
        'Some #tag\nIn some lines\nwith the #tag there'
    )
  })

  test('remove tags on task lines', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\n- [ ] In some lines\n- [ ] with the #tag there', 'tag')).toBe(
        '- [ ] Some  \n- [ ] In some lines\n- [ ] with the   there'
    )
  })

  test('remove tags on task lines and leave on non task', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there', 'tag')).toBe(
        '- [ ] Some  \nIn some lines #tag\n- [ ] with the   there'
    )
  })

  test('leave other tags alone', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there', 'othertag')).toBe(
        '- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there'
    )
  })

  test('remove tags on nested task lines and leave on non task', () => {
    let block = '\n' +
        '- [ ] Some #tag\n' +
        'In some lines #tag\n' +
        '- [ ] with the #tag there\n' +
        '\t- [ ] And #tag nested\n'
    expect(H.clearBlockIDs(block, 'tag')).toBe(
        '\n- [ ] Some  \nIn some lines #tag\n- [ ] with the   there\n\t- [ ] And   nested\n'
    )
  })

  test('single line', () => {
    expect(H.clearBlockIDs('- [ ] Set available budget 🆔 BNC0 #Project', 'Project')).toBe(
        '- [ ] Set available budget '
    )
  })

})

describe('testing the block boundary detection', () => {
  test('empty file block start', () => {
    expect(H.getBlockStart(getEditor([], 0))).toBe(0)
  })

  test('file with lines block start', () => {
    expect(H.getBlockStart(getEditor(['one', 'two', 'three'], 2))).toBe(0);
    expect(H.getBlockStart(getEditor(['one', 'two', 'three'], 1))).toBe(0);
  })

  test('block at the start of the file', () => {
    expect(H.getBlockStart(getEditor(['# One', 'two', 'three'], 0))).toBe(1);
    expect(H.getBlockStart(getEditor(['# One', 'two', 'three'], 1))).toBe(1);
    expect(H.getBlockStart(getEditor(['# One', 'two', 'three'], 2))).toBe(1);
  })

  test('tag at the start of the file', () => {
    expect(H.getBlockStart(getEditor(['#One', 'two', 'three'], 1))).toBe(0);
    expect(H.getBlockStart(getEditor(['#One', 'two', 'three'], 2))).toBe(0);
  })

  test('multiple blocks get the right one', () => {
    let file = ['first', '# One', 'two', 'three', '# Four', 'five', 'six']
    expect(H.getBlockStart(getEditor(file, 0))).toBe(0);
    expect(H.getBlockStart(getEditor(file, 1))).toBe(2);
    expect(H.getBlockStart(getEditor(file, 2))).toBe(2);
    expect(H.getBlockStart(getEditor(file, 3))).toBe(2);
    expect(H.getBlockStart(getEditor(file, 4))).toBe(5);
    expect(H.getBlockStart(getEditor(file, 5))).toBe(5);
    expect(H.getBlockStart(getEditor(file, 6))).toBe(5);
  })

})

describe('testing the block end detection', () => {
  test('empty file block start', () => {
    expect(H.getBlockEnd(getEditor([], 0))).toBe(1)
  })

  test('file with lines block start', () => {
    expect(H.getBlockEnd(getEditor(['one', 'two', 'three'], 2))).toBe(3);
    expect(H.getBlockEnd(getEditor(['one', 'two', 'three'], 1))).toBe(3);
  })

  test('block at the start of the file', () => {
    expect(H.getBlockEnd(getEditor(['# One', 'two', 'three'], 1))).toBe(3);
    expect(H.getBlockEnd(getEditor(['# One', 'two', 'three'], 2))).toBe(3);
  })

  test('tag at the start of the file', () => {
    expect(H.getBlockEnd(getEditor(['#One', 'two', 'three'], 1))).toBe(3);
    expect(H.getBlockEnd(getEditor(['#One', 'two', 'three'], 2))).toBe(3);
  })

  test('multiple blocks get the right one', () => {
    let file = ['first', '# One', 'two', 'three', '# Four', 'five', 'six']
    expect(H.getBlockEnd(getEditor(file, 0))).toBe(1);
    expect(H.getBlockEnd(getEditor(file, 1))).toBe(4);
    expect(H.getBlockEnd(getEditor(file, 2))).toBe(4);
    expect(H.getBlockEnd(getEditor(file, 3))).toBe(4);
    expect(H.getBlockEnd(getEditor(file, 4))).toBe(7);
    expect(H.getBlockEnd(getEditor(file, 5))).toBe(7);
    expect(H.getBlockEnd(getEditor(file, 6))).toBe(7);
  })

})

export let file: string[] = []
describe('test getting the section name', () => {
  beforeAll(() => {
    file = ['first', '# One', 'two', 'three', '# Four', 'five', 'six'];
  })

  test('empty file should be filename', () => {
    expect(H.getSectionName(getEditor([], 0), 'test.md')).toBe('test.md');
  })

  test('file with no block should be filename', () => {
    expect(H.getSectionName(getEditor(['one', 'two', 'three'], 0), 'test.md')).toBe('test.md');
  })

  test('file with section but before it', () => {
    expect(H.getSectionName(getEditor(file, 0), "test.md")).toBe("test.md");
  })

  test('file with section and on the section line', () => {
    expect(H.getSectionName(getEditor(file, 1), "test.md")).toBe("# One");
  })

  test('file with section and in the section', () => {
    expect(H.getSectionName(getEditor(file, 2), "test.md")).toBe("# One");
  })

  test('file with section and in the second section line', () => {
    expect(H.getSectionName(getEditor(file, 4), "test.md")).toBe("# Four");
  })

  test('file with section and in the second section', () => {
    expect(H.getSectionName(getEditor(file, 5), "test.md")).toBe("# Four");
  })

})