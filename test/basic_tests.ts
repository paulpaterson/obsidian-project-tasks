import Helper from "../helpers";

let H = Helper;
export let file: string[] = []

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
      expect(H.clearBlockIDs(`This ${char} Hello`, 'tag')).toBe('This ');
    })

    test(`clear ${char} block IDs beginning of line`, () => {
      expect(H.clearBlockIDs(`${char} Hello there`, 'tag')).toBe('there');
    })

    test(`clear ${char} block IDs middle of line`, () => {
      expect(H.clearBlockIDs(`I said ${char} Hello there`, 'tag')).toBe('I said there');
    })

    test(`clear ${char} block IDs with numbers`, () => {
      expect(H.clearBlockIDs(`This ${char} Hello123 there`, 'tag')).toBe('This there');
    })
  }

  test('clear blocker and ID with numbers', () => {
    expect(H.clearBlockIDs('This 🆔 Hello123 ⛔ Hello123 there', 'tag')).toBe('This there');
  })


  test('clear blocker and ID with numbers and tag', () => {
    expect(H.clearBlockIDs('- [ ] This 🆔 Hello123 ⛔ Hello123 there #tag', 'tag')).toBe('- [ ] This there  ');
  })

  test('clear blocker with multiple sections', () => {
    expect(H.clearBlockIDs('one\n# Header\n- [ ] one 🆔 Hello123 ⛔ Hello123 there #Tag\n\n# Other\n- [ ] two 🆔 Hello123 ⛔ Hello123 there #Tag\n', 'Tag'))
        .toBe('one\n# Header\n- [ ] one there  \n\n# Other\n- [ ] two there  \n')
  })

  test('empty task can be cleared', () => {
    expect(H.clearBlockIDs('- [ ] 🆔 O7 ⛔ O6 #tag', 'tag'))
        .toBe('- [ ]  ')
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
        '- [ ] Set available budget  '
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

describe('testing the adding of block ids to some tasks', () => {
  test('empty file should be unchanged', () => {
    expect(H.addTaskIDs('', 'Proj', 'Tag', true, false, 3, 0))
        .toBe('')
  })

  test('file with no tasks should be unchanged', () => {
    expect(H.addTaskIDs('this is a file\nwith no tasks\nso there', 'Proj', 'Tag', true, false, 3, 0))
        .toBe('this is a file\nwith no tasks\nso there')
  })

  test('adding block ids to a line with them on already', () => {
    expect(H.addTaskIDs('- [ ] 🆔 O7 ⛔ O6 #tag', 'O', 'tag', true, false, 3, 0))
        .toBe('- [ ] 🆔 O0 #tag')
  })

  test('file tasks should add ids not using prefix and no tag', () => {
    expect(H.addTaskIDs('\n' +
        '\n' +
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '- [ ] three\n', 'Proj', '', true, false, 3, 0))
        .toBe('\n\n- [ ] one 🆔 Proj0\n- [ ] two 🆔 Proj1 ⛔ Proj0\n\n- [ ] three 🆔 Proj2 ⛔ Proj1\n')
  })

  test('file tasks should add ids not using prefix and adding tags', () => {
    expect(H.addTaskIDs('\n' +
        '\n' +
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '- [ ] three\n', 'Proj', 'Tag', true, false, 3, 0))
        .toBe('\n\n- [ ] one 🆔 Proj0 #Tag\n- [ ] two 🆔 Proj1 ⛔ Proj0 #Tag\n\n- [ ] three 🆔 Proj2 ⛔ Proj1 #Tag\n')
  })

  test('line with task and sequential start set', () => {
    expect(H.addTaskIDs('- [ ] one', 'Proj', '', true, false, 3, 10))
        .toBe('- [ ] one 🆔 Proj10')
  })

  test('two lines with task and prefix', () => {
    let result = H.addTaskIDs('- [ ] one\n- [ ] two', 'Proj', '', true, true, 3, 10);
    let match = /- \[ ] one 🆔 Proj(\d\d\d)\n- \[ ] two 🆔 Proj\d\d\d ⛔ Proj\1/m
    expect(match.test(result)).toBeTruthy()
  })

  test('nested tasks in parallel', () => {
    expect(H.addTaskIDs('- [ ] one\n' +
        '\t- [ ] two\n' +
        '\t- [ ] three\n' +
        '- [ ] four\n', 'F', 'tag', true, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F0 #tag\n' +
            '- [ ] four 🆔 F3 ⛔ F0,F1,F2 #tag' +
            '\n'
        )
  })

  test('nested tasks with extra nesting in parallel', () => {
    expect(H.addTaskIDs('- [ ] one \n' +
        '\t- [ ] two \n' +
        '\t- [ ] three \n' +
        '\t\t- [ ] four \n' +
        '\t\t- [ ] five \n' +
        '\t- [ ] six \n' +
        '- [ ] seven \n' +
        '- [ ] eight ', 'F', 'tag', true, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F0 #tag\n' +
            '\t\t- [ ] four 🆔 F3 ⛔ F1,F2 #tag\n' +
            '\t\t- [ ] five 🆔 F4 ⛔ F1,F2 #tag\n' +
            '\t- [ ] six 🆔 F5 ⛔ F0 #tag\n' +
            '- [ ] seven 🆔 F6 ⛔ F0,F1,F2,F3,F4,F5 #tag\n' +
            '- [ ] eight 🆔 F7 ⛔ F6 #tag'
        )
  })

  test('nested tasks with sequential', () => {
    expect(H.addTaskIDs('- [ ] one\n' +
        '\t- [ ] two\n' +
        '\t- [ ] three\n' +
        '- [ ] four\n', 'F', 'tag', false, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F1 #tag\n' +
            '- [ ] four 🆔 F3 ⛔ F2 #tag' +
            '\n'
        )
  })

  test('nested tasks extra nesting sequential', () => {
    expect(H.addTaskIDs('- [ ] one \n' +
        '\t- [ ] two \n' +
        '\t- [ ] three \n' +
        '\t\t- [ ] four \n' +
        '\t\t- [ ] five \n' +
        '\t- [ ] six \n' +
        '- [ ] seven \n' +
        '- [ ] eight ', 'F', 'tag', false, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F1 #tag\n' +
            '\t\t- [ ] four 🆔 F3 ⛔ F2 #tag\n' +
            '\t\t- [ ] five 🆔 F4 ⛔ F3 #tag\n' +
            '\t- [ ] six 🆔 F5 ⛔ F4 #tag\n' +
            '- [ ] seven 🆔 F6 ⛔ F5 #tag\n' +
            '- [ ] eight 🆔 F7 ⛔ F6 #tag'
        )
  })
})

describe('testing getting all the blocks in a file', () =>  {
  test('empty file is empty', () => {
    expect(H.getAllBlockStarts(getEditor([''],0)))
        .toStrictEqual([0])
  })

  test('file with no sections', () => {
    expect(H.getAllBlockStarts(getEditor(['one', 'two', 'three'],0)))
        .toStrictEqual([0])
  })

  test('file with one section that starts from beginning', () => {
    expect(H.getAllBlockStarts(getEditor(['# one', 'two', 'three'],0)))
        .toStrictEqual([0])
  })

  test('file with one section that starts after the beginning', () => {
    expect(H.getAllBlockStarts(getEditor(['one', '# two', 'three'],0)))
        .toStrictEqual([0, 1])
  })

  test('file with multiple sections that starts after the beginning', () => {
    expect(H.getAllBlockStarts(getEditor(['one', '# two', 'three', '# four', 'five', '# six', '# seven'],0)))
        .toStrictEqual([0, 1, 3, 5, 6])
  })


})