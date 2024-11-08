import {Editor} from "obsidian";

// Regex for block boundary
const BLOCK_BOUNDARY = /^#+\s/;
const DEBUG = true;

interface SimpleCursor {
    line: number
}

interface SimpleEditor {
    // This interface is created to help with the functions here that need the Obsidian Editor
    getCursor(): SimpleCursor;
    getLine(n: number): string;
    lineCount(): number
}

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
        let remove_id = /🆔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_id, '');

        // Remove existing Blocks
        let remove_block = /⛔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_block, '');

        // Remove existing tags
        if (automatic_tag) {
            let remove_tag = new RegExp("^(\\s*-\\s\\[[ x\\-\\/]\]\\s.*)(#" + automatic_tag + ")(.*)$", "mg");
            sel = sel.replaceAll(remove_tag, '$1 $3');
        }

        return sel;
    }

    static getBlockEnd(editor: SimpleEditor) {
        // Find the end of the block
        let blockEnd = editor.getCursor().line;
        if (blockEnd >= editor.lineCount() - 1) return blockEnd + 1;
        blockEnd += 1;
        while (!BLOCK_BOUNDARY.test(editor.getLine(blockEnd))) {
            blockEnd++;
            if (blockEnd > editor.lineCount() - 1) return blockEnd;
        }
        return blockEnd;
    }

    static getBlockStart(editor: SimpleEditor) {
        // Find the start of the block
        let blockStart = editor.getCursor().line;
        if (BLOCK_BOUNDARY.test(editor.getLine(blockStart))) {
            return Math.min(editor.lineCount() -1, blockStart + 1);
        }
        while (blockStart > 0 && !BLOCK_BOUNDARY.test(editor.getLine(blockStart - 1))) {
            blockStart--;
        }
        return blockStart;
    }

    static getSectionName(editor: SimpleEditor, file_name: string) {
        let section_start = Helper.getBlockStart(editor);
        if (section_start == 0) {
            return file_name
        } else {
            return editor.getLine(section_start-1);
        }
    }

    static addTaskIDs(sel: string, prefix: string, automatic_tag: string, parallel: boolean, use_prefix: boolean,
                      random_id_length: number, sequential_start: number) {
        const regex = /^(\s*-\s\[[ x\-\/]\]\s)?(.*)$/mg;

        // Clear all the existing block and project ID's
        sel = Helper.clearBlockIDs(sel, automatic_tag);

        if (DEBUG) console.log(`Replaced ids and blocks to give: ${sel}`);

        const matches = sel.matchAll(regex);
        let lines = "";
        let first = true;
        let idx = 0;
        let nesting_ids = ["0:ERROR!"];
        let current_nesting = 0;
        let is_parallel = false;
        let this_id;

        // Go through all the lines and add appropriate ID and block tags
        for (const match of matches) {
            if (!first) {
                lines += "\n";
            }
            // Is this a task line at all?
            if (match[1]) {
                // Watch out for changes in nesting
                if (parallel) {
                    let nesting_depth = Helper.getNestingLevel(match[1]);
                    if (nesting_depth > current_nesting) {
                        // Add a new level of nesting
                        current_nesting += 1;
                        is_parallel = true;
                        nesting_ids.push(``);
                    } else if (nesting_depth < current_nesting) {
                        // Remove levels of nesting
                        while (current_nesting > nesting_depth) {
                            current_nesting -= 1;
                            let nested = nesting_ids.pop();
                            if (nested) {
                                nesting_ids[nesting_ids.length - 1] += `,${nested}`;
                            }
                            is_parallel = current_nesting > 0;
                        }
                    }
                }
                let this_line;
                // Get an id to use
                if (use_prefix) {
                    this_id = `${prefix}${Helper.generateRandomDigits(random_id_length)}`;
                } else {
                    this_id = `${prefix}${idx + sequential_start}`;
                }
                // Add the id into there
                let cleaned_line = match[2].trim();
                // Add a space at the end if needed
                if (cleaned_line != "") cleaned_line += " ";
                this_line = `${match[1]}${cleaned_line}🆔 ${this_id}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    if (is_parallel) {
                        this_line += ` ⛔ ${nesting_ids[current_nesting - 1]}`;
                    } else {
                        this_line += ` ⛔ ${nesting_ids[nesting_ids.length - 1]}`;
                    }
                }

                // Add an automatic tag if we need it
                if (automatic_tag) {
                    this_line += ` #${automatic_tag}`;
                }

                // Append this line
                lines += this_line;
                idx += 1;
                if (is_parallel) {
                    if (nesting_ids[nesting_ids.length - 1]) nesting_ids[nesting_ids.length - 1] += ",";
                    nesting_ids[nesting_ids.length - 1] += `${this_id}`;
                } else {
                    nesting_ids[nesting_ids.length - 1] = this_id;
                }
                if (DEBUG) console.log(`Nesting level ${current_nesting}, ids ${nesting_ids}`);
            } else {
                // Not a task line so just keep it as is
                lines += `${match[2].trim()}`;
            }
            first = false;
        }
        return lines;
    }

}