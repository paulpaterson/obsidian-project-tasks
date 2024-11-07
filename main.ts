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
import * as net from "net";
import Helper from "./helpers";

// Turn on to allow debugging in the console
const DEBUG = true;

// Regex for block boundary
// ToDo - this is duplicated in the Helper class, should refactor this
const BLOCK_BOUNDARY = /^#+\s/;


enum PrefixMethod {
    UsePrefix= '1',
    SectionName = '2',
    FileName = '3'
}

enum NestingBehaviour {
    ParallelExecution = '1',
    SequentialExecution = '2',
}

interface ProjectTasksSettings {
    idPrefixMethod: PrefixMethod;
    projectPrefix: string;
    randomIDLength: number;
    sequentialStartNumber: number;
    removeVowels: boolean;
    firstLettersOfWords: boolean;
    automaticTagName: string;
    nestedTaskBehavior: NestingBehaviour;

}

const DEFAULT_SETTINGS: ProjectTasksSettings = {
    idPrefixMethod: PrefixMethod.UsePrefix,
    projectPrefix: 'prj',
    randomIDLength: 6,
    sequentialStartNumber: 1,
    removeVowels: false,
    firstLettersOfWords: false,
    automaticTagName: "Project",
    nestedTaskBehavior: NestingBehaviour.ParallelExecution,
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
                let lines = Helper.clearBlockIDs(sel, this.settings.automaticTagName);
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

        this.addCommand({
            id: "add-project-task-list",
            name: "Add active project task list",
            editorCallback: (editor, view) => {
                this.addActiveProjectList(editor);
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ProjectTasksSettingsTab(this.app, this));

    }

    addActiveProjectList(editor: Editor) {
        // A view to show active tasks
        const active_tasks_view = `\`\`\`tasks
tags includes #${this.settings.automaticTagName}
not done
hide backlink
is not blocked
\`\`\``;
        editor.replaceSelection(active_tasks_view);
    }

    blockUpdate(editor: Editor, prefix: string, add_ids: boolean) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Get the block boundaries
        let blockStart = Helper.getBlockStart(editor);
        let blockEnd = Helper.getBlockEnd(editor);
        let last_line_length = editor.getLine(blockEnd + 1).length;

        const blockContent = editor.getRange({ line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}`);

        let lines;
        if (add_ids) {
            lines = this.addTaskIDs(blockContent, prefix);
        } else {
            lines = Helper.clearBlockIDs(blockContent, this.settings.automaticTagName);
        }

        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}\nNew: ${lines}`);
        editor.replaceRange(lines, { line: blockStart, ch: 0 }, { line: blockEnd, ch: last_line_length });
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
                let section_start = Helper.getBlockStart(editor);
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
        return Helper.getPrefixFromString(raw_prefix, this.settings.firstLettersOfWords, this.settings.removeVowels);
    }

    getFilename(view: MarkdownFileInfo) {
       if (!view.file?.name) {
            return this.settings.projectPrefix;
        } else {
            return view.file.name.split('.')[0];
        }
    }

    addTaskIDs(sel: string, prefix: string) {
        const regex = /^(\s*-\s\[[ x\-\/]\]\s)?(.*)$/mg;

        // Clear all the existing block and project ID's
        sel = Helper.clearBlockIDs(sel, this.settings.automaticTagName);

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
                if (this.settings.nestedTaskBehavior == NestingBehaviour.ParallelExecution) {
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
                if (this.settings.idPrefixMethod == PrefixMethod.UsePrefix) {
                    this_id = `${prefix}${Helper.generateRandomDigits(this.settings.randomIDLength)}`;
                } else {
                    this_id = `${prefix}${idx + this.settings.sequentialStartNumber}`;
                }
                // Add the id into there
                this_line = `${match[1]}${match[2].trim()} 🆔 ${this_id}`;
                if (idx > 0) {
                    // Add the blocks after the very first task
                    if (is_parallel) {
                        this_line += ` ⛔ ${nesting_ids[current_nesting - 1]}`;
                    } else {
                        this_line += ` ⛔ ${nesting_ids.last()}`;
                    }
                }

                // Add an automatic tag if we need it
                if (this.settings.automaticTagName) {
                    this_line += ` #${this.settings.automaticTagName}`;
                }

                // Append this line
                lines += this_line;
                idx += 1;
                if (is_parallel) {
                    if (nesting_ids.last()) nesting_ids[nesting_ids.length - 1] += ",";
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
            .setName('Initial sequential ID number')
            .setDesc('Start number for sequential ID\'s')
            .addSlider(text => text
                .setValue(this.plugin.settings.sequentialStartNumber)
                .setLimits(0, 1, 1)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.sequentialStartNumber = value;
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

        new Setting(containerEl)
            .setName('Automatically add Tag')
            .setDesc('A tag to add to each task - do not include the # symbol')
            .addText(text => text
                .setValue(this.plugin.settings.automaticTagName)
                .setPlaceholder("Tag Name")
                .onChange(async (value) => {
                    this.plugin.settings.automaticTagName = value.replaceAll('#', '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Nested tags behaviour')
            .setDesc('Determines whether nested tags will create parallel execution tags or sequential')
            .addDropdown(dropDown => {
                dropDown.addOption('1', 'Parallel Execution');
                dropDown.addOption('2', 'Sequential Execution')
                .setValue(this.plugin.settings.nestedTaskBehavior)
                .onChange(async (value) => {
                    this.plugin.settings.nestedTaskBehavior = value as NestingBehaviour;
                    await this.plugin.saveSettings();
                })});
    }
}

