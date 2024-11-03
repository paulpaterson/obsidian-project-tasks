import {
    App,
    Editor,
    EditorPosition, MarkdownFileInfo,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    View
} from 'obsidian';

// Turn on to allow debugging in the console
const DEBUG = true;
// Regex for block boundary
const BLOCK_BOUNDARY = /^#+\s/;



enum PrefixMethod {
    UsePrefix= '1',
    SectionName = '2',
    FileName = '3'
}

interface ProjectTasksSettings {
    idPrefixMethod: PrefixMethod;
    projectPrefix: string;
    randomIDLength: number;
    removeVowels: boolean;
    firstLettersOfWords: boolean;
}

const DEFAULT_SETTINGS: ProjectTasksSettings = {
    idPrefixMethod: PrefixMethod.UsePrefix,
    projectPrefix: 'prj',
    randomIDLength: 6,
    removeVowels: false,
    firstLettersOfWords: false
}

export default class ProjectTasks extends Plugin {
    settings: ProjectTasksSettings;

    async onload() {
        if (DEBUG) console.log('Project Tasks starting');

        await this.loadSettings();

        this.addCommand({
            id: "set-ids",
            name: "Set project ids on Selection",
            editorCallback: (editor, view) => {
                let sel = editor.getSelection();
                let lines = this.addTaskIDs(sel, this.getPrefix(editor, view));
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        this.addCommand({
            id: "clear-ids",
            name: "Clear project ids on Selection",
            editorCallback: (editor, view) => {
                let sel = editor.getSelection();
                let lines = this.clearBlockIDs(sel);
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        this.addCommand({
            id: "set-ids-block",
            name: "Set project ids on Block",
            editorCallback: (editor, view) => {
                this.blockUpdate(editor, this.getPrefix(editor, view), true);
            }
        })

        this.addCommand({
            id: "clear-ids-block",
            name: "Clear project ids on Block",
            editorCallback: (editor, view) => {
                this.blockUpdate(editor, this.getPrefix(editor, view), false);
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ProjectTasksSettingsTab(this.app, this));

    }

    blockUpdate(editor: Editor, prefix: string, add_ids: boolean) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Get the block boundaries
        let blockStart = this.getBlockStart(editor);
        let blockEnd = this.getBlockEnd(editor);
        let last_line_length = editor.getLine(blockEnd + 1).length;

        const blockContent = editor.getRange({ line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}`);

        let lines;
        if (add_ids) {
            lines = this.addTaskIDs(blockContent, prefix);
        } else {
            lines = this.clearBlockIDs(blockContent);
        }

        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}\nNew: ${lines}`);
        editor.replaceRange(lines, { line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
    }

    private getBlockEnd(editor: Editor) {
        // Find the end of the block
        let blockEnd = editor.getCursor().line;
        while (!BLOCK_BOUNDARY.test(editor.getLine(blockEnd))) {
            blockEnd++;
            if (blockEnd > editor.lineCount() - 1) return blockEnd;
        }
        return blockEnd;
    }

    private getBlockStart(editor: Editor) {
        // Find the start of the block
        let blockStart = editor.getCursor().line;
        while (blockStart > 0 && !BLOCK_BOUNDARY.test(editor.getLine(blockStart - 1))) {
            blockStart--;
        }
        return blockStart;
    }

    generateRandomDigits(length: number): string {
      const digits = '0123456789';
      let randomString = '';

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        randomString += digits[randomIndex];
      }

      return randomString;
    }

    clearBlockIDs(sel: string) {
        // Remove existing ID's
        let remove_id = /\h?🆔\s\w+\h*/g;
        sel = sel.replaceAll(remove_id, '');

        // Remove existing Blocks
        let remove_block = /\h?⛔\s\w+\h*/g;
        sel = sel.replaceAll(remove_block, '');

        return sel;
    }

    getPrefix(editor: Editor, view: MarkdownFileInfo) {
        let raw_prefix;
        switch (this.settings.idPrefixMethod) {
            case PrefixMethod.UsePrefix: {
                raw_prefix = this.settings.projectPrefix;
                break;
            }
            case PrefixMethod.FileName: {
                raw_prefix = this.getFilename(view);
                break;
            }
            case PrefixMethod.SectionName: {
                // Try to find the name of the block that contains the cursor or the selection
                let section_start = this.getBlockStart(editor);
                let section_line;
                if (section_start == 0) {
                    section_line = "";
                } else {
                    section_line = editor.getLine(section_start-1);
                }
                if (DEBUG) console.log('Prefix check .. Found section: ', section_start, section_line);

                // Is there a block at all or are we just in a file with no blocks
                if (BLOCK_BOUNDARY.test(section_line)) {
                    raw_prefix = section_line;
                } else {
                    // Return the filename anyway
                    raw_prefix = this.getFilename(view);
                }
                break;
            }
        }
        return this.getPrefixFromString(raw_prefix);
    }

    getFilename(view: MarkdownFileInfo) {
       if (!view.file?.name) {
            return this.settings.projectPrefix;
        } else {
            return view.file.name.split('.')[0];
        }
    }

    getPrefixFromString(text: string) {
        // Remove any special signs
        text = text.replaceAll(/[#\[\]]/g, '');
        // Only use the first letters of words if needed
        if (this.settings.firstLettersOfWords) {
            let words = text.split(/\s+/);
            if (DEBUG) console.log("found words", words);
            text = "";
            for (let word of words) {
                if (word) {
                    text = `${text}${word[0].toUpperCase()}`;
                }
            }
        }
        // Remove spaces
        text = text.replaceAll(' ', '');
        // Remove vowels if needed
        if (this.settings.removeVowels) {
            text = text.replaceAll(/[aeiou]/g, '');
        }
        return text;
    }

    addTaskIDs(sel: string, prefix: string) {
        const regex = /^(-\s\[[ x\-\/]\]\s)?(.*)$/mg;

        // Clear all the existing block and project ID's
        sel = this.clearBlockIDs(sel);

        if (DEBUG) console.log(`Replaced ids and blocks to give: ${sel}`);

        const matches = sel.matchAll(regex);
        let lines = "";
        let first = true;
        let idx = 0;
        let this_id;
        let last_id;

        // Go through all the lines and add appropriate ID and block tags
        for (const match of matches) {
            if (!first) {
                lines += "\n";
            }
            // Is this a task line at all?
            if (match[1]) {
                // Get an id to use
                if (this.settings.idPrefixMethod == PrefixMethod.UsePrefix) {
                    this_id = this.generateRandomDigits(this.settings.randomIDLength);
                } else {
                    this_id = `${idx}`;
                }
                // Add the id into there
                lines += `${match[1]}${match[2].trim()} 🆔 ${prefix}${this_id}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    lines += ` ⛔ ${prefix}${last_id}`;
                }
                idx += 1;
                last_id = this_id;
            } else {
                // Not a task line so just keep it as is
                lines += `${match[2].trim()}`;
            }
            first = false;
        }
        return lines;
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}


class ProjectTasksSettingsTab extends PluginSettingTab {
    plugin: ProjectTasks;

    constructor(app: App, plugin: ProjectTasks) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Project ID method')
            .setDesc('Choose how the ID will be determined')
            .addDropdown(dropDown => {
                dropDown.addOption('1', 'Use prefix');
                dropDown.addOption('2', 'Use Section name');
                dropDown.addOption('3', 'Use filename')
                .setValue(this.plugin.settings.idPrefixMethod)
                .onChange(async (value) => {
                    this.plugin.settings.idPrefixMethod = value as PrefixMethod;
                    await this.plugin.saveSettings();
                })});

        new Setting(containerEl)
            .setName('Project ID prefix')
            .setDesc('Prefix to use when creating an ID for a task')
            .addText(text => text
                .setPlaceholder('ID prefix')
                .setValue(this.plugin.settings.projectPrefix)
                .onChange(async (value) => {
                    this.plugin.settings.projectPrefix = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Length of random ID number')
            .setDesc('How many digits to use for random ID when using a fixed prefix')
            .addSlider(text => text
                .setValue(this.plugin.settings.randomIDLength)
                .setLimits(3, 6, 1)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.randomIDLength = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Remove vowels')
            .setDesc('Remove vowels from the prefix when getting from the filename or block name')
            .addToggle(text => text
                .setValue(this.plugin.settings.removeVowels)
                .onChange(async (value) => {
                    this.plugin.settings.removeVowels = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('First letter of words')
            .setDesc('Only use the first letter of words to form the prefix')
            .addToggle(text => text
                .setValue(this.plugin.settings.firstLettersOfWords)
                .onChange(async (value) => {
                    this.plugin.settings.firstLettersOfWords = value;
                    await this.plugin.saveSettings();
                }));
    }
}
