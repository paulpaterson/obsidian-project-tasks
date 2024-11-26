import Helper, {DEFAULT_SETTINGS, PrefixMethod, ProjectTasksSettings} from "../helpers";

// ToDo: Remove the skipped tests when done with config migration

let H = Helper;
export let file: string[] = [];
export let editor: MockEditor;

// A Class that implements an editor for use in unit tests
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
    // The Obsidian editor always seems to allow a return of a blank line after the lines[line_count] position
    return (n >= this.lines.length) ? '' : this.lines[n];
  }

  lineCount() {
    return this.lines.length;
  }

  getRange(start: {line: number, ch: number}, end: {line: number, ch: number}) {
    let lines = [this.getLine(start.line).slice(start.ch)];
    for (let idx = start.line + 1; idx < end.line - 1; idx++) {
      lines.push(this.getLine(idx));
    }
    lines.push(this.getLine(end.line - 1).slice(0, end.ch - 1));
    return lines.join('\n');
  }

  replaceRange(text: string, start: {line: number, ch: number}, end: {line: number, ch: number}) {
    // Get the lines of text from the string
    let new_lines = text.split(/\n/);
    // First remove the partial lines
    this.lines[start.line] = this.getLine(start.line).slice(0, start.ch);
    this.lines[end.line - 1] = this.getLine(end.line - 1).slice(end.ch + 1);
    // Now add the start and end lines
    this.lines[start.line] += new_lines[0];
    if (new_lines.length > 1) this.lines[end.line - 1] = new_lines[new_lines.length - 1] + this.lines[end.line - 1];
    // Now remove the middle lines
    this.lines.splice(start.line + 1, end.line - start.line - 2);
    // Now add the lines from the other
    for (let idx = 0; idx < new_lines.length - 2; idx++) {
      this.lines.splice(start.line + 1 + idx, 0, new_lines[idx + 1]);
    }
  }

  atLine(line: number) {
    this.cursor.line = line;
    return this;
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

function getSettings(data: Partial<ProjectTasksSettings>) {
  return {...DEFAULT_SETTINGS, ...data};
}

let TEST_FILE_1 = [
        '- [ ] one',
        '- [ ] two',
        '',
        '# Section One',
        '- [ ] three',
        '- [ ] four',
        '# Section Two',
        '- [ ] five',
        '- [ ] six',
        ''
];

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
      expect(H.clearBlockIDs(`This ${char} Hello`, ['tag'], false)).toBe('This ');
    })

    test(`clear ${char} block IDs beginning of line`, () => {
      expect(H.clearBlockIDs(`${char} Hello there`, ['tag'], false)).toBe('there');
    })

    test(`clear ${char} block IDs middle of line`, () => {
      expect(H.clearBlockIDs(`I said ${char} Hello there`, ['tag'], false)).toBe('I said there');
    })

    test(`clear ${char} block IDs with numbers`, () => {
      expect(H.clearBlockIDs(`This ${char} Hello123 there`, ['tag'], false)).toBe('This there');
    })
  }

  test('clear blocker and ID with numbers', () => {
    expect(H.clearBlockIDs('This 🆔 Hello123 ⛔ Hello123 there', ['tag'], false)).toBe('This there');
  })


  test('clear blocker and ID with numbers and tag', () => {
    expect(H.clearBlockIDs('- [ ] This 🆔 Hello123 ⛔ Hello123 there #tag', ['tag'], false))
        .toBe('- [ ] This there');
  })

  test('clear blocker with multiple sections', () => {
    expect(H.clearBlockIDs('one\n# Header\n- [ ] one 🆔 Hello123 ⛔ Hello123 there #tag\n\n# Other\n- [ ] two 🆔 Hello123 ⛔ Hello123 there #tag\n', ['tag'], false))
        .toBe('one\n# Header\n- [ ] one there\n\n# Other\n- [ ] two there\n')
  })

  test('empty task can be cleared', () => {
    expect(H.clearBlockIDs('- [ ] 🆔 O7 ⛔ O6 #tag', ['tag'], false))
        .toBe('- [ ] ')
  })
})

describe('testing of clearing tags from tasks', () => {
  test('leave tags on non task lines', () => {
    expect(H.clearBlockIDs('Some #tag\nIn some lines\nwith the #tag there', ['tag'], false)).toBe(
        'Some #tag\nIn some lines\nwith the #tag there'
    )
  })

  test('remove tags on task lines', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\n- [ ] In some lines\n- [ ] with the #tag there', ['tag'], false)).toBe(
        '- [ ] Some\n- [ ] In some lines\n- [ ] with the there'
    )
  })

  test('remove tags on task lines and leave on non task', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there', ['tag'], false)).toBe(
        '- [ ] Some\nIn some lines #tag\n- [ ] with the there'
    )
  })

  test('leave other tags alone', () => {
    expect(H.clearBlockIDs('- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there', ['othertag'], false)).toBe(
        '- [ ] Some #tag\nIn some lines #tag\n- [ ] with the #tag there'
    )
  })

  test('remove tags on nested task lines and leave on non task', () => {
    let block = '\n' +
        '- [ ] Some #tag\n' +
        'In some lines #tag\n' +
        '- [ ] with the #tag there\n' +
        '\t- [ ] And #tag nested\n'
    expect(H.clearBlockIDs(block, ['tag'], false)).toBe(
        '\n- [ ] Some\nIn some lines #tag\n- [ ] with the there\n\t- [ ] And nested\n'
    )
  })

  test('single line', () => {
    expect(H.clearBlockIDs('- [ ] Set available budget 🆔 BNC0 #Project', ['Project'], false)).toBe(
        '- [ ] Set available budget'
    )
  })

  test('clearing ids can cope with clearing all tags', () => {
    expect(H.clearBlockIDs('- [ ] one #tag\n' +
        '- [ ] two #tag\n' +
        '- [ ] three #other #tag\n' +
        '- [ ] four #another  left\n' +
        '- [ ] five #tag not a tag #other #another either\n', ['tag'], true)
    ).toBe(
        '- [ ] one\n' +
        '- [ ] two\n' +
        '- [ ] three\n' +
        '- [ ] four  left\n' +
        '- [ ] five not a tag either\n',
    )
  })

  test('clearing ids can cope with clearing all tags even if no automatic tag', () => {
    expect(H.clearBlockIDs('- [ ] one #tag\n' +
        '- [ ] two #tag\n' +
        '- [ ] three #other #tag\n' +
        '- [ ] four #another left\n' +
        '- [ ] five #tag not a tag #other #another either\n', [], true)
    ).toBe(
        '- [ ] one\n' +
        '- [ ] two\n' +
        '- [ ] three\n' +
        '- [ ] four left\n' +
        '- [ ] five not a tag either\n',
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
    expect(H.addTaskIDs('', 'Proj', ['tag'], true, false, 3, 0))
        .toBe('')
  })

  test('file with no tasks should be unchanged', () => {
    expect(H.addTaskIDs('this is a file\nwith no tasks\nso there', 'Proj', ['tag'], true, false, 3, 0))
        .toBe('this is a file\nwith no tasks\nso there')
  })

  test('adding block ids to a line with them on already', () => {
    expect(H.addTaskIDs('- [ ] 🆔 O7 ⛔ O6 #tag', 'O', ['tag'], true, false, 3, 0))
        .toBe('- [ ] 🆔 O0 #tag')
  })

  test('file tasks should add ids not using prefix and no tag', () => {
    expect(H.addTaskIDs('\n' +
        '\n' +
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '- [ ] three\n', 'Proj', [], true, false, 3, 0))
        .toBe('\n\n- [ ] one 🆔 Proj0\n- [ ] two 🆔 Proj1 ⛔ Proj0\n\n- [ ] three 🆔 Proj2 ⛔ Proj1\n')
  })

  test('file tasks should add ids not using prefix and adding tags', () => {
    expect(H.addTaskIDs('\n' +
        '\n' +
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '- [ ] three\n', 'Proj', ['tag'], true, false, 3, 0))
        .toBe('\n\n- [ ] one 🆔 Proj0 #tag\n- [ ] two 🆔 Proj1 ⛔ Proj0 #tag\n\n- [ ] three 🆔 Proj2 ⛔ Proj1 #tag\n')
  })

  test('line with task and sequential start set', () => {
    expect(H.addTaskIDs('- [ ] one', 'Proj', [], true, false, 3, 10))
        .toBe('- [ ] one 🆔 Proj10')
  })

  test('two lines with task and prefix', () => {
    let result = H.addTaskIDs('- [ ] one\n- [ ] two', 'Proj', [], true, true, 3, 10);
    let match = /- \[ ] one 🆔 Proj(\d\d\d)\n- \[ ] two 🆔 Proj\d\d\d ⛔ Proj\1/m
    expect(match.test(result)).toBeTruthy()
  })

  test('nested tasks in parallel', () => {
    expect(H.addTaskIDs('- [ ] one\n' +
        '\t- [ ] two\n' +
        '\t- [ ] three\n' +
        '- [ ] four\n', 'F', ['tag'], true, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F0 #tag\n' +
            '- [ ] four 🆔 F3 ⛔ F0,F1,F2 #tag' +
            '\n'
        )
  })

  test('nested tasks with extra nesting in parallel', () => {
    expect(H.addTaskIDs('- [ ] one\n' +
        '\t- [ ] two\n' +
        '\t- [ ] three\n' +
        '\t\t- [ ] four\n' +
        '\t\t- [ ] five\n' +
        '\t- [ ] six\n' +
        '- [ ] seven\n' +
        '- [ ] eight', 'F', ['tag'], true, false, 3, 0))
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
        '- [ ] four\n', 'F', ['tag'], false, false, 3, 0))
        .toBe('- [ ] one 🆔 F0 #tag\n' +
            '\t- [ ] two 🆔 F1 ⛔ F0 #tag\n' +
            '\t- [ ] three 🆔 F2 ⛔ F1 #tag\n' +
            '- [ ] four 🆔 F3 ⛔ F2 #tag' +
            '\n'
        )
  })

  test('nested tasks extra nesting sequential', () => {
    expect(H.addTaskIDs('- [ ] one\n' +
        '\t- [ ] two\n' +
        '\t- [ ] three\n' +
        '\t\t- [ ] four\n' +
        '\t\t- [ ] five\n' +
        '\t- [ ] six\n' +
        '- [ ] seven\n' +
        '- [ ] eight', 'F', ['tag'], false, false, 3, 0))
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

  test('adding block ids should preserve existing indentation', () => {
    expect(H.addTaskIDs('- [ ] one\n\ttwo\n\t\tthree\n- [ ] four', 'F', [], false, false, 3, 0)).toBe(
           '- [ ] one 🆔 F0\n\ttwo\n\t\tthree\n- [ ] four 🆔 F1 ⛔ F0'
    )
  })

  test('adding block ids should retain existing tags', () => {
    expect(H.addTaskIDs('- [ ] #one', 'F', [], false, false, 1, 0))
        .toBe('- [ ] #one 🆔 F0')
  })

  test('adding multiple tags to a task line', () => {
    expect(H.addTaskIDs('- [ ] this', 'F', ['one', 'two'], false, false, 2, 0))
        .toBe('- [ ] this 🆔 F0 #one #two')
  })

  test('adding multiple tags to a task line should not duplicate', () => {
    expect(H.addTaskIDs('- [ ] #one this', 'F', ['one', 'two'], false, false, 2, 0))
        .toBe('- [ ] this 🆔 F0 #one #two')
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

describe.skip('testing for adding ids to a single block in a file', () => {
  test('in pre section block', () => {
    let ed = getEditor(TEST_FILE_1, 0);
    H.doBlockUpdate(ed, true, 'The Filename', [], '', false, false, 1, 0, false);
    let result = ed.lines.join('\n');
    expect(result)
        .toBe(
        '- [ ] one 🆔 TF0\n' +
        '- [ ] two 🆔 TF1 ⛔ TF0\n' +
        '\n' +
        '# Section One\n' +
        '- [ ] three\n' +
        '- [ ] four\n' +
        '# Section Two\n' +
        '- [ ] five\n' +
        '- [ ] six\n'
        )
  })

  test('in section one', () => {
    let ed = getEditor(TEST_FILE_1, 3);
    H.doBlockUpdate(ed, true, 'The Filename', [], '', false, false, 1, 0, false);
    let result = ed.lines.join('\n');
    expect(result)
        .toBe(
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '# Section One\n' +
        '- [ ] three 🆔 SO0\n' +
        '- [ ] four 🆔 SO1 ⛔ SO0\n' +
        '# Section Two\n' +
        '- [ ] five\n' +
        '- [ ] six\n'
        )
  })

  test('in section two', () => {
    let ed = getEditor(TEST_FILE_1, 6);
    H.doBlockUpdate(ed, true, 'The Filename', [], '', false, false, 1, 0, false);
    let result = ed.lines.join('\n');
    expect(result)
        .toBe(
        '- [ ] one\n' +
        '- [ ] two\n' +
        '\n' +
        '# Section One\n' +
        '- [ ] three\n' +
        '- [ ] four\n' +
        '# Section Two\n' +
        '- [ ] five 🆔 ST0\n' +
        '- [ ] six 🆔 ST1 ⛔ ST0\n'
        )
  })
})

describe('testing for adding ids to all blocks in a file', () => {
  test.skip('file with using section as prefix', () => {
    expect(H.getEntireConvertedFile(getEditor(TEST_FILE_1, 0), 'The Filename', [], '', false, false, 1, 0, false))  // filename, auto add tags, prefix, parallel, use_prefix, random id length, sequential start
        .toBe(
        '- [ ] one 🆔 TF0\n' +
        '- [ ] two 🆔 TF1 ⛔ TF0\n' +
        '\n' +
        '# Section One\n' +
        '- [ ] three 🆔 SO0\n' +
        '- [ ] four 🆔 SO1 ⛔ SO0\n' +
        '# Section Two\n' +
        '- [ ] five 🆔 ST0\n' +
        '- [ ] six 🆔 ST1 ⛔ ST0\n'
        )
  })

})

describe('testing of individual line parsing', () => {
  test.each([
        ['- [ ] a task line', ' ', 'a task line', '- [ ] ', 0],
        ['- [x] a task line', 'x', 'a task line', '- [x] ', 0],
        ['- [-] a task line', '-', 'a task line', '- [-] ', 0],
        ['- [/] a task line', '/', 'a task line', '- [/] ', 0],
        ['- [ ] ', ' ', '', '- [ ] ', 0],
        ['- [ ]  ', ' ', ' ', '- [ ] ', 0],
        ['- [ ] a #task line', ' ', 'a #task line', '- [ ] ', 0],
        ['\t- [ ] a #task line', ' ', 'a #task line', '\t- [ ] ', 1],
        ['\t\t- [ ] a #task line', ' ', 'a #task line', '\t\t- [ ] ', 2],
    ])(`line is task "%s"`, (full_line, status, line_body, task_prefix, nesting: number) => {
      let parsed = H.parseLine(full_line);
      expect(parsed.is_task).toBeTruthy();
      expect(parsed.status_type).toBe(status);
      expect(parsed.line_text).toBe(line_body);
      expect(parsed.task_prefix).toBe(task_prefix);
      expect(parsed.nesting).toBe(nesting);
    })

  test.each([
        ['a task line', 'a task line'],
        ['\ta task line', '\ta task line'],
        ['\t\ta task line', '\t\ta task line'],
    ])(`line is not task "%s"`, (full_line, line_body) => {
      let parsed = H.parseLine(full_line);
      expect(parsed.is_task).toBeFalsy();
      expect(parsed.line_text).toBe(line_body);
    })

  test.each([
      ['- [ ] no tags', 'no tags'],
      ['- [ ] tag at #end', 'tag at'],
      ['- [ ] #tag at start', 'at start'],
      ['- [ ] tag #at  middle', 'tag  middle'],
      ['- [ ] two #consecutive #tags', 'two'],
      ['- [ ] two #consecutive #tags and then some', 'two and then some'],
      ['- [ ] two #tags around #word', 'two around'],
  ])('removing all tags from "%s"', (line, cleaned_line) => {
      let parsed = H.parseLine(line);
      expect(parsed.removeAllTags()).toBe(cleaned_line);
  })

  test.each([
      [
        '- [ ] a list of #one #two #three #four and other #five',
        [],
        'a list of #one #two #three #four and other #five'
      ],
      [
        '- [ ] a list of #one #two #three #four and other #five',
        ['two'],
        'a list of #one #three #four and other #five'
      ],
      [
        '- [ ] a list of #one #two #three #four and other #five',
        ['one'],
        'a list of #two #three #four and other #five'
      ],
      [
        '- [ ] a list of #one #two #three #four and other #five',
        ['one', 'four', 'two'],
        'a list of #three and other #five'
      ],
      [
        '- [ ] a list of #one #two #three #four and other #five',
        ['five', 'six'],
        'a list of #one #two #three #four and other'
      ],
  ])('removing specific tags from "%s", list %s', (line, removal_tags, cleaned_line) => {
      let parsed = H.parseLine(line);
      expect(parsed.removeTags(removal_tags)).toBe(cleaned_line);
  })
})

describe('testing of the getPrefix logic', () => {
  beforeAll(() => {
    editor = getEditor(['one', '# Section Two', 'three', 'four', '# Section Five', 'six'], 0)
  })
  test('using fixed prefix', () => {
    expect(H.getPrefix(editor, 'The File Name', getSettings({projectPrefix: 'Project'})))
        .toBe('Project');
  })

  test('using filename', () => {
    expect(H.getPrefix(editor, 'Project File', getSettings({idPrefixMethod: PrefixMethod.FileName})))
        .toBe('ProjectFile');
  })

  test('using filename with first letters only', () => {
    expect(H.getPrefix(editor, 'The File Name', getSettings({idPrefixMethod: PrefixMethod.FileName, firstLettersOfWords: true})))
        .toBe('TFN');
  })

  test('using filename remove vowels', () => {
    expect(H.getPrefix(editor, 'Test This Please', getSettings({idPrefixMethod: PrefixMethod.FileName, removeVowels: true})))
        .toBe('TstThsPls');
  })

  test('using section name not in section', () => {
    expect(H.getPrefix(editor.atLine(0), 'The File Name', getSettings({idPrefixMethod: PrefixMethod.SectionName, firstLettersOfWords: true})))
        .toBe('TFN');
  })

  test('using section name in section', () => {
    expect(H.getPrefix(editor.atLine(1), 'The File Name', getSettings({idPrefixMethod: PrefixMethod.SectionName, firstLettersOfWords: true})))
        .toBe('ST');
    expect(H.getPrefix(editor.atLine(4), 'The File Name', getSettings({idPrefixMethod: PrefixMethod.SectionName, firstLettersOfWords: true})))
        .toBe('SF');
  })
})

