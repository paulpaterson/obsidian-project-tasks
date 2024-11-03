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
                new Notice(`Project tasks created from: ${sel}`);
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
                new Notice(`Project tasks cleared from: ${sel}`);
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
        switch (this.settings.idPrefixMethod) {
            case PrefixMethod.UsePrefix: {
                return this.settings.projectPrefix;
            }
            case PrefixMethod.FileName: {
                if (!view.file?.name) {
                    return this.settings.projectPrefix;
                } else {
                    return view.file.name.replaceAll(' ', '').split('.')[0];
                }
            }
            case PrefixMethod.SectionName: {
                let section_start = this.getBlockStart(editor);
                let section_line;
                if (section_start == 0) {
                    section_line = "";
                } else {
                    section_line = editor.getLine(section_start-1);
                }
                if (DEBUG) console.log('Prefix check .. Found section: ', section_start, section_line);
                if (BLOCK_BOUNDARY.test(section_line)) {
                    return section_line.replaceAll(' ', '').replaceAll('#', '');
                } else {
                    // Return the filename anyway
                    if (!view.file?.name) {
                        return this.settings.projectPrefix;
                    } else {
                        return view.file.name.replaceAll(' ', '').split('.')[0];
                    }
                }
            }
        }
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

        // Go through all the lines and add appropriate ID and block tags
        for (const match of matches) {
            if (!first) {
                lines += "\n";
            }
            // Is this a task line at all?
            if (match[1]) {
                // Add the id into there
                lines += `${match[1]}${match[2].trim()} 🆔 ${prefix}${idx}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    lines += ` ⛔ ${prefix}${idx - 1}`;
                }
                idx += 1;
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
