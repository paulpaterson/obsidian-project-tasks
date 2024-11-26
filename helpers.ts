// Regex for block boundary
import {Editor, MarkdownFileInfo} from "obsidian";

const BLOCK_BOUNDARY = /^#+\s/;
const DEBUG = true;


export enum PrefixMethod {
    UsePrefix = '1',
    SectionName = '2',
    FileName = '3'
}

export enum NestingBehaviour {
    ParallelExecution = '1',
    SequentialExecution = '2',
}

export interface ProjectTasksSettings {
    idPrefixMethod: PrefixMethod;
    projectPrefix: string;
    randomIDLength: number;
    sequentialStartNumber: number;
    removeVowels: boolean;
    firstLettersOfWords: boolean;
    automaticTagNames: string[];
    clearAllTags: boolean;
    nestedTaskBehavior: NestingBehaviour;
}

export const DEFAULT_SETTINGS: ProjectTasksSettings = {
    idPrefixMethod: PrefixMethod.UsePrefix,
    projectPrefix: 'prj',
    randomIDLength: 6,
    sequentialStartNumber: 1,
    removeVowels: false,
    firstLettersOfWords: false,
    automaticTagNames: ["Project"],
    clearAllTags: false,
    nestedTaskBehavior: NestingBehaviour.ParallelExecution,
}

interface SimpleCursor {
    line: number
}

interface SimpleEditor {
    // This interface is created to help with the functions here that need the Obsidian Editor
    getCursor(): SimpleCursor;
    getLine(n: number): string;
    lineCount(): number;
    getRange(start: {line: number, ch: number}, end: {line: number, ch: number}): string;
    replaceRange(text: string, start: {line: number, ch: number}, end: {line: number, ch: number}): void;
}

// ToDo: need to refactor to allow passing the settings object around so that we can more easily break apart the doBlockUpdate


class ParsedLine {
    public task_prefix: string;

    constructor(public is_task: boolean, public status_type: string, public line_text: string,
                public nesting: number) {
        if (this.is_task) {
            let indents = '\t'.repeat(nesting);
            this.task_prefix = `${indents}- [${status_type}] `;
        } else {
            this.task_prefix = '';
        }
    }

    getLineSplit(line: string) {
        return line.split(/(\s+)/);
    }

    removeAllTags() {
        return this.removeTags();
    }

    removeTags(tags_to_remove?: string[]) {
        let words = this.getLineSplit(this.line_text);
        for (let idx = 0; idx < words.length; idx++) {
            let word = words[idx];
            if (word.trim().length != 0) {
                // It is a valid tag we should be removing
                let is_valid_tag = word.startsWith('#') && (!tags_to_remove || tags_to_remove.indexOf(word.slice(1)) >= 0)
                if (is_valid_tag) {
                    // It is a tag, so do not include it and eat the previous or following whitespace
                    words[idx] = '';
                    if (idx != 0) {
                        words[idx - 1] = '';
                    } else if (idx != words.length - 1) {
                        words[idx + 1] = '';
                    }
                }
            } else {
                // This was whitespace
                if (idx == words.length - 1) {
                    // We should ignore this
                    words[idx] = '';
                }
            }
        }
        return words.join('');
    }
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

    static clearBlockIDs(sel: string, automatic_tags: string[], clear_all_tags: boolean) {
        // Remove existing ID's
        let remove_id = /🆔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_id, '');

        // Remove existing Blocks
        let remove_block = /⛔\s[\w,]+[ \t]*/g;
        sel = sel.replaceAll(remove_block, '');

        // Remove the tags
        let cleaned_text = [];
        for (let line of sel.split(/\r?\n/)) {
            let parsed = this.parseLine(line);
            if (parsed.is_task) {
                if (clear_all_tags) {
                    cleaned_text.push(parsed.task_prefix + parsed.removeAllTags());
                } else {
                    cleaned_text.push(parsed.task_prefix + parsed.removeTags(automatic_tags));
                }
            } else {
                cleaned_text.push(parsed.line_text);
            }
        }

        return cleaned_text.join('\n');
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

    static getAllBlockStarts(editor: SimpleEditor) {
        // Return all the lines that mark the start of a block in a file
        let blocks = [0];
        let section = /^#?\s\w+/
        for (let line_number = 0; line_number < editor.lineCount(); line_number++) {
            if (section.test(editor.getLine(line_number))) {
                // Special case when the first line is a section we don't have to add it
                if (line_number > 0) {
                    blocks.push(line_number);
                }
            }
        }

        return blocks;
    }

    static getSectionName(editor: SimpleEditor, file_name: string) {
        let section_start = Helper.getBlockStart(editor);
        if (section_start == 0) {
            return file_name
        } else {
            return editor.getLine(section_start-1);
        }
    }

    static addTaskIDs(sel: string, prefix: string, automatic_tags: string[], parallel: boolean, use_prefix: boolean,
                      random_id_length: number, sequential_start: number) {
        // Clear all the existing block and project ID's
        sel = Helper.clearBlockIDs(sel, automatic_tags, false);

        if (DEBUG) console.log(`Replaced ids and blocks to give: ${sel}`);

        let lines = "";
        let first = true;
        let idx = 0;
        let nesting_ids = ["0:ERROR!"];
        let current_nesting = 0;
        let is_parallel = false;
        let this_id;

        // Go through all the lines and add appropriate ID and block tags
        for (const line of sel.split(/\r?\n/)) {
            let match = this.parseLine(line);
            if (!first) {
                lines += "\n";
            }
            // Is this a task line at all?
            if (match.is_task) {
                // Watch out for changes in nesting
                if (parallel) {
                    let nesting_depth = match.nesting;
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
                let cleaned_line = match.line_text;
                // Add a space at the end if needed
                if (cleaned_line != "") cleaned_line += " ";
                this_line = `${match.task_prefix}${cleaned_line}🆔 ${this_id}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    if (is_parallel) {
                        this_line += ` ⛔ ${nesting_ids[current_nesting - 1]}`;
                    } else {
                        this_line += ` ⛔ ${nesting_ids[nesting_ids.length - 1]}`;
                    }
                }

                // Add an automatic tag if we need it
                for (const tag of automatic_tags) {
                    let tag_text = ` #${tag}`;
                    if (this_line.indexOf(tag_text) < 0) {
                        this_line += tag_text;
                    }
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
                lines += match.line_text;
            }
            first = false;
        }
        return lines;
    }

    static blockUpdate(editor: SimpleEditor, filename: string, add_ids: boolean, settings: ProjectTasksSettings) {
        const prefix = this.getPrefix(editor, filename, settings);
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Get the block boundaries
        let blockStart = Helper.getBlockStart(editor);
        let blockEnd = Helper.getBlockEnd(editor);
        let last_line_length = editor.getLine(blockEnd + 1).length;

        const blockContent = editor.getRange({line: blockStart, ch: 0}, {line: blockEnd, ch: last_line_length});
        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}`);

        let lines;
        if (add_ids) {
            lines = Helper.addTaskIDs(blockContent, prefix, settings.automaticTagNames,
                settings.nestedTaskBehavior == NestingBehaviour.ParallelExecution,
                settings.idPrefixMethod == PrefixMethod.UsePrefix,
                settings.randomIDLength, settings.sequentialStartNumber)
        } else {
            lines = Helper.clearBlockIDs(blockContent, settings.automaticTagNames,
                settings.clearAllTags);
        }

        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}\nNew: ${lines}`);
        editor.replaceRange(lines, {line: blockStart, ch: 0}, {line: blockEnd, ch: last_line_length});
    }

    static getEntireConvertedFile(editor: SimpleEditor, filename: string, automatic_tags: string[],
                                  prefix: string, parallel: boolean, use_prefix: boolean,
                                  random_id_length: number, sequential_start: number, clear_all_tags: boolean) {
        return '';
    }

    static parseLine(line: string) {
        const regex = /^(\s*-\s\[([ x\-\/])\]\s)?(.*)$/;
        let match = regex.exec(line);
        if (match) {
            // Was an expected line
            if (match[1]) {
                // This is a task line
                return new ParsedLine(true, match[2], match[3], this.getNestingLevel(line));
            } else {
                // This isn't a task line
                return new ParsedLine(false, '', match[3], 0);
            }
        } else {
            // Something went wrong here
            throw new Error(`Line was not understood: "${line}"`);
        }
    }


    static getPrefix(editor: SimpleEditor, filename: string, settings: ProjectTasksSettings) {
        let raw_prefix;
        switch (settings.idPrefixMethod) {
            case PrefixMethod.UsePrefix: {
                raw_prefix = settings.projectPrefix;
                break;
            }
            case PrefixMethod.FileName: {
                raw_prefix = filename;
                break;
            }
            case PrefixMethod.SectionName: {
                // Try to find the name of the block that contains the cursor or the selection
                raw_prefix = Helper.getSectionName(editor, filename);
            }
        }
        return Helper.getPrefixFromString(raw_prefix, settings.firstLettersOfWords, settings.removeVowels);
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
}
