const vscode = require('vscode');
const { execSync } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let form = vscode.commands.registerCommand('commit-helper.createCommit', async () => {
        try {
            const action = await vscode.window.showQuickPick(
                [
                  { label: 'FIX', description: 'For bug fixes: mostly used in stable versions but also valid if fixing a recent bug in the development version.' },
                  { label: 'REF', description: 'For refactoring: when a feature is heavily rewritten.' },
                  { label: 'ADD', description: 'For adding new modules or features.' },
                  { label: 'REM', description: 'For removing resources: removing dead code, views, modules, etc.' },
                  { label: 'REV', description: 'For reverting commits: if a commit causes issues or is unwanted, it is reverted using this tag.' },
                  { label: 'MOV', description: 'For moving files: use git move and do not change the content of the moved file, otherwise Git may lose track of the file’s history.' },
                  { label: 'REL', description: 'For release commits: new major or minor stable versions.' },
                  { label: 'IMP', description: 'For improvements: most changes in the development version are incremental improvements not related to another tag.' },
                  { label: 'MERGE', description: 'For merge commits: used in forward port of bug fixes or as the main commit for a feature involving several separated commits.' },
                  { label: 'CLA', description: 'For signing the Odoo Individual Contributor License.' },
                  { label: 'I18N', description: 'For changes in translation files.' },
                  { label: 'PERF', description: 'For performance patches.' }
                ],
                { placeHolder: 'Select the commit action' }
              );

            if (!action) {
                vscode.window.showWarningMessage('Cancel Action.');
                return;
            }

            const module = await vscode.window.showInputBox({
                prompt: 'Which module is affected by this change?',
                placeHolder: 'For example: auth, database, ui',
            });

            if (!module) {
                vscode.window.showWarningMessage('Cancel Module.');
                return;
            }

            const description = await vscode.window.showInputBox({
                prompt: 'Briefly describe the changes made (maximum 80 characters)',
                placeHolder: 'Enter the description',
                validateInput: (text) => {
                    return text.length > 80
                        ? `The description must not exceed 80 characters (${text.length})`
                        : null;
                },
            });
            

            if (!description) {
                vscode.window.showWarningMessage('Cancel Description.');
                return;
            }

            const commitMessage = `[${action}] ${module}: ${description}`;

            execSync(`git commit -m "${commitMessage}"`, {
                cwd: vscode.workspace.rootPath,
            });

            vscode.window.showInformationMessage(`Create Commit: ${commitMessage}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error Create Commit: ${error.message}`);
        }
    });

    context.subscriptions.push(form);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
