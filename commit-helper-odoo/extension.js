const vscode = require('vscode');

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
                { placeHolder: 'Select the commit action',
                    ignoreFocusOut: true }
            );

            if (!action) {
                vscode.window.showWarningMessage('Action selection was cancelled.');
                return;
            }

            const module = await vscode.window.showInputBox({
                prompt: 'Which module is affected by this change?',
                placeHolder: 'For example: auth, database, ui',
                ignoreFocusOut: true
            });

            if (!module) {
                vscode.window.showWarningMessage('Module input was cancelled.');
                return;
            }

            const shortDescription = await vscode.window.showInputBox({
                prompt: 'Briefly describe the changes made (maximum 80 characters)',
                placeHolder: 'Enter the short description',
                ignoreFocusOut: true,
                validateInput: (text) => {
                    if (text.includes('`') || text.includes('"')) {
                        return 'The short description cannot contain backticks (`) or (").';
                    }
                    return text.length > 80
                        ? `The description must not exceed 80 characters (${text.length})`
                        : null;
                },
            });

            if (!shortDescription) {
                vscode.window.showWarningMessage('Short description input was cancelled.');
                return;
            }

            const longDescription = await vscode.window.showInputBox({
                prompt: 'Provide a detailed description of the changes made (maximum 300 characters)',
                placeHolder: 'Enter the long description (optional)',
                ignoreFocusOut: true,
                validateInput: (text) => {
                    if (text.includes('`') || text.includes('"')) {
                        return 'The long description cannot contain backticks (`) or (").';
                    }
                    return text.length > 300
                        ? `The long description must not exceed 300 characters (${text.length})`
                        : null;
                },
            });

            const wrapText = (text, maxLength) => {
                if (!text) return '';
                return text.match(new RegExp(`.{1,${maxLength}}`, 'g')).join('\n');
            };

            const formattedLongDescription = wrapText(longDescription, 80);

            const commitMessage = `\n[${action.label}] ${module}: ${shortDescription}\n\n${formattedLongDescription}`;

            const activeTerminal = vscode.window.activeTerminal;

            if (activeTerminal) {
                activeTerminal.sendText(`git commit -m "${commitMessage}"`);
                vscode.window.showInformationMessage(`Commit message written in the active terminal: ${commitMessage}`);
            } else {
                vscode.window.showWarningMessage('No active terminal found.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating commit: ${error.message}`);
        }
    });

    context.subscriptions.push(form);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
