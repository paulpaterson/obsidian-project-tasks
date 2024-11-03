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
// Number of digits to use for a random prefix
const RANDOM_LENGTH = 6;


enum PrefixMethod {
    UsePrefix= '1',
    SectionName = '2',
    FileName = '3'
}

interface MyPluginSettings {
    idPrefixMethod: PrefixMethod;
    projectPrefix: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    idPrefixMethod: PrefixMethod.UsePrefix,
    projectPrefix: 'prj'
}

export default class ProjectTasks extends Plugin {
    settings: MyPluginSettings;

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
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    blockUpdate(editor: Editor, prefix: string, add_ids: boolean) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Get the block boundaries
        let blockStart = this.getBlockStart(editor);
        let blockEnd = this.getBlockEnd(editor);
        let last_line_length = editor.getLine(blockEnd + 1).length;

        const blockContent = editor.getRange({ line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });

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
        while (blockEnd < editor.lineCount() - 1 && !BLOCK_BOUNDARY.test(editor.getLine(blockEnd + 1))) {
            blockEnd++;
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
        // Remove any # signs
        text = text.replaceAll("#", '');
        // Remove spaces
        text = text.replaceAll(' ', '');

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
                    this_id = this.generateRandomDigits(RANDOM_LENGTH);
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

class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
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
    }
}
