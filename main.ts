import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

// Remember to rename these classes and interfaces!!

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class HelloWorldPaul extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        console.log('Project Tasks starting');

        await this.loadSettings();

        this.addCommand({
            id: "set-ids",
            name: "Set project ids on Selection",
            editorCallback: (editor, view) => {
                let sel = editor.getSelection();
                let lines = this.addTaskIDs(sel);
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
                this.blockUpdate(editor, true);
            }
        })

        this.addCommand({
            id: "clear-ids-block",
            name: "Clear project ids on Block",
            editorCallback: (editor, view) => {
                this.blockUpdate(editor, false);
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


    }

    blockUpdate(editor: Editor, add_ids: boolean) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Regex for block boundary
        const block_boundary = /^#+\s/;

        // Find the start of the block
        let blockStart = cursor.line;
        while (blockStart > 0 && !block_boundary.test(editor.getLine(blockStart - 1))) {
        blockStart--;
        }
        // Find the end of the block
        let blockEnd = cursor.line;
        while (blockEnd < editor.lineCount() - 1 && !block_boundary.test(editor.getLine(blockEnd + 1))) {
        blockEnd++;
        }

        const blockContent = editor.getRange({ line: blockStart, ch: 0 }, { line: blockEnd, ch: line.length });
        console.log(`The block is: ${blockContent}`);

        let lines;
        if (add_ids) {
            lines = this.addTaskIDs(blockContent);
        } else {
            lines = this.clearBlockIDs(blockContent);
        }
        editor.replaceRange(lines, { line: blockStart, ch: 0 }, { line: blockEnd, ch: line.length });
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

    addTaskIDs(sel: string) {
        const regex = /^(-\s\[[ x\-\/]\]\s)?(.*)$/mg;

        // Clear all the existing block and project ID's
        sel = this.clearBlockIDs(sel);

        console.log(`Replaced ids and blocks to give: ${sel}`);

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
                lines += `${match[1]}${match[2].trim()} 🆔 prj${idx}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    lines += ` ⛔ prj${idx - 1}`;
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
    plugin: HelloWorldPaul;

    constructor(app: App, plugin: HelloWorldPaul) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.mySetting)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
