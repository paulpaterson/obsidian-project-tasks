import Helper from "../helpers";

let H = Helper;

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

