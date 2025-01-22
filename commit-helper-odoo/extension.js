const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let isCommitInProgress = false;

    let form = vscode.commands.registerCommand('commit-helper.createCommit', async () => {
        try {
            if (isCommitInProgress) {
                vscode.window.showWarningMessage('A commit is already in progress.');
                return;
            }

            isCommitInProgress = true;
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folders found.');
                isCommitInProgress = false;
                return;
            }

            const findGitRepositories = (dir) => {
                const repositories = [];
                const files = fs.readdirSync(dir);
                files.forEach((file) => {
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        if (fs.existsSync(path.join(fullPath, '.git'))) {
                            const repoName = path.basename(fullPath);

                            let branchName = '';
                            try {
                                branchName = execSync('git rev-parse --abbrev-ref HEAD', { cwd: fullPath }).toString().trim();
                            } catch (err) {
                                branchName = 'unknown';
                            }

                            repositories.push({ label: `${repoName} (branch: ${branchName})`, description: fullPath });
                        }
                        repositories.push(...findGitRepositories(fullPath));
                    }
                });
                return repositories;
            };

            const getModules = (dir) => {
                const modules = [];
                const files = fs.readdirSync(dir);
                files.forEach((file) => {
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory() && file !== '.git') {
                        modules.push(fullPath);
                    }
                });
                return modules;
            };

            const gitRepositories = findGitRepositories(workspaceFolders[0].uri.fsPath);
            if (gitRepositories.length === 0) {
                vscode.window.showWarningMessage('No Git repositories found in the workspace.');
                isCommitInProgress = false;
                return;
            }

            const selectedRepo = await vscode.window.showQuickPick(gitRepositories, {
                placeHolder: 'Select a repository to commit',
                ignoreFocusOut: true
            });

            if (!selectedRepo) {
                vscode.window.showWarningMessage('No repository selected.');
                isCommitInProgress = false;
                return;
            }

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
                { placeHolder: 'Select the commit action', ignoreFocusOut: true }
            );

            if (!action) {
                vscode.window.showWarningMessage('Action selection was cancelled.');
                isCommitInProgress = false;
                return;
            }

            const modules = getModules(selectedRepo.description);
            if (modules.length === 0) {
                vscode.window.showWarningMessage('No modules found in the selected repository.');
                isCommitInProgress = false;
                return;
            }

            const module = await vscode.window.showQuickPick(modules.map((dir) => path.basename(dir)), {
                placeHolder: 'Select a module within the repository',
                ignoreFocusOut: true
            });

            if (!module) {
                vscode.window.showWarningMessage('No module selected.');
                isCommitInProgress = false;
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
                isCommitInProgress = false;
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

            isCommitInProgress = false;
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating commit: ${error.message}`);
            isCommitInProgress = false;
        }
    });

    const cancelCommit = vscode.commands.registerCommand('commit-helper.cancelCommit', () => {
        if (isCommitInProgress) {
            vscode.window.showInformationMessage('Commit process has been cancelled.');
            isCommitInProgress = false;
        } else {
            vscode.window.showWarningMessage('No commit process is currently in progress.');
        }
    });

    context.subscriptions.push(form, cancelCommit);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
