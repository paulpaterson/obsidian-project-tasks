import {App, Editor, MarkdownFileInfo, Plugin, PluginSettingTab, Setting} from 'obsidian';
import Helper, {DEFAULT_SETTINGS, NestingBehaviour, PrefixMethod, ProjectTasksSettings} from "./helpers";

// Turn on to allow debugging in the console
const DEBUG = true;


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
                let lines = Helper.addTaskIDs(sel, Helper.getPrefix(editor, this.getFilename(view), this.settings), this.settings.automaticTagNames, this.settings.nestedTaskBehavior == NestingBehaviour.ParallelExecution, this.settings.idPrefixMethod == PrefixMethod.UsePrefix, this.settings.randomIDLength, this.settings.sequentialStartNumber);
                editor.replaceSelection(
                    `${lines}`
                );
            }
        });

        this.addCommand({
            id: "set-ids-block",
            name: "Set project ids on Block",
            editorCallback: (editor, view) => {
                Helper.blockUpdate(editor, this.getFilename(view), true, this.settings);
            }
        })

        this.addCommand({
            id: "set-ids-file",
            name: "Set project ids on entire file",
            editorCallback: (editor, view) => {
                Helper.addIDsToFile(editor, this.getFilename(view), this.settings);
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
            id: "clear-ids-block",
            name: "Clear project ids on Block",
            editorCallback: (editor, view) => {
                Helper.blockUpdate(editor, this.getFilename(view), false, this.settings);
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

