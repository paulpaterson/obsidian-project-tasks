import ProjectTasks from "../main";

describe('testing determining the nesting level', () => {
  test('zero nesting level', () => {
    let p = new ProjectTasks(null, null);
    expect(p.getNestingLevel("- [ ] ")).toBe(0);
  });
});

