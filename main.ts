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

enum PrefixMethod {
    UsePrefix = '1',
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
    automaticTagNames: string[];
    clearAllTags: boolean;
    nestedTaskBehavior: NestingBehaviour;
}

const DEFAULT_SETTINGS: ProjectTasksSettings = {
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
                let lines = Helper.addTaskIDs(sel, this.getPrefix(editor, view), this.settings.automaticTagNames, this.settings.nestedTaskBehavior == NestingBehaviour.ParallelExecution, this.settings.idPrefixMethod == PrefixMethod.UsePrefix, this.settings.randomIDLength, this.settings.sequentialStartNumber);
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
                let lines = Helper.clearBlockIDs(sel, this.settings.automaticTagNames, this.settings.clearAllTags);
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

        this.addCommand({
            id: "clear-ids-file",
            name: "Clear project ids in entire file",
            editorCallback: (editor, view) => {
                let last_line = editor.lineCount()
                let range_from = {line: 0, ch: 0}
                let range_to = {line: last_line, ch: editor.getLine(last_line).length}
                let sel = editor.getRange(range_from, range_to);
                let lines = Helper.clearBlockIDs(sel, this.settings.automaticTagNames, this.settings.clearAllTags);
                editor.replaceRange(
                    `${lines}`,
                    range_from,
                    range_to
                );
            }
        })

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ProjectTasksSettingsTab(this.app, this));

    }

    addActiveProjectList(editor: Editor) {
        // A view to show active tasks
        const active_tasks_view = `\`\`\`tasks
tags includes #${this.settings.automaticTagNames}
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

        const blockContent = editor.getRange({line: blockStart, ch: 0}, {line: blockEnd, ch: last_line_length});
        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}`);

        let lines;
        if (add_ids) {
            lines = Helper.addTaskIDs(blockContent, prefix, this.settings.automaticTagNames, this.settings.nestedTaskBehavior == NestingBehaviour.ParallelExecution, this.settings.idPrefixMethod == PrefixMethod.UsePrefix, this.settings.randomIDLength, this.settings.sequentialStartNumber)
        } else {
            lines = Helper.clearBlockIDs(blockContent, this.settings.automaticTagNames, this.settings.clearAllTags);
        }

        if (DEBUG) console.log(`Start ${blockStart}, End ${blockEnd}, last length ${last_line_length}\nOrig: ${blockContent}\nNew: ${lines}`);
        editor.replaceRange(lines, {line: blockStart, ch: 0}, {line: blockEnd, ch: last_line_length});
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
                raw_prefix = Helper.getSectionName(editor, this.getFilename(view));
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
                    })
            });

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
            .setName('Automatically add tags')
            .setDesc('A list of tags (one per line) to add to each task - do not include the # symbol')
            .addTextArea((text) => {
                text.setValue(this.plugin.settings.automaticTagNames.join('\n'))
                    .onChange((value) => {
                        this.plugin.settings.automaticTagNames = value.split('\n').filter(line => line.trim() !== '');
                        this.plugin.saveSettings();
                    }).then(textArea => {
                    textArea.inputEl.style.width = "100%";
                    textArea.inputEl.rows = 5;
                });
            });

        new Setting(containerEl)
            .setName('Clear all tags from project tasks')
            .setDesc('When clearing tags from project tasks clear all existing tags not just the automatically added ones')
            .addToggle(text => text
                .setValue(this.plugin.settings.clearAllTags)
                .onChange(async (value) => {
                    this.plugin.settings.clearAllTags = value;
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
                    })
            });



    }
}

