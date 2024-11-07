
export default class Helper {
    // Simple helper class that contains the business logic
    // of the app. This is extracted here to allow unit testing
    constructor() {
    }

    static getNestingLevel(task_marker: string): number {
        // The nesting level is the number of spaces before the first "-" character
        let parts = task_marker.replaceAll("\n", "").split("-");
        return parts[0].length;
    }

    static generateRandomDigits(length: number): string {
      const digits = '0123456789';
      let randomString = '';

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        randomString += digits[randomIndex];
      }

      return randomString;
    }

    static getPrefixFromString(text: string, first_letters: boolean, remove_vowels: boolean) {
        // Remove any special signs
        text = text.replaceAll(/[#\[\]]/g, '');
        // Break into words
        let words = text.split(/\s+/);
        text = "";
        for (let word of words) {
            if (word) {
                text = `${text}${word[0].toUpperCase()}`;
                if (!first_letters) {
                    let remainder = word.slice(1);
                    // Remove vowels if needed
                    if (remove_vowels) {
                        remainder = remainder.replaceAll(/[aeiou]/g, '');
                    }
                    text = `${text}${remainder}`;
                }
            }
        }
        // Remove spaces
        text = text.replaceAll(' ', '');
        return text;
    }

    static clearBlockIDs(sel: string, automatic_tag: string) {
        // Remove existing ID's
        let remove_id = /[ \t]?🆔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_id, '');

        // Remove existing Blocks
        let remove_block = /[ \t]?⛔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_block, '');

        // Remove existing tags
        if (automatic_tag) {
            let remove_tag = new RegExp("^(\\s*-\\s\\[[ x\\-\\/]\]\\s.*)(#" + automatic_tag + ")(.*)$", "mg");
            sel = sel.replaceAll(remove_tag, '$1 $3');
        }

        return sel;
    }
}