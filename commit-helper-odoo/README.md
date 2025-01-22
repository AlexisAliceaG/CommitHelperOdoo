# Commit Helper Odoo

This is a Visual Studio Code extension that helps generate commit messages for Odoo projects.

## Usage

1. Make sure you have an active terminal in VSCode.
2. Press **Ctrl + Shift + P** to open the command palette.
3. Type **Commit odoo** and select the **Commit Helper: Create Commit** option.
4. Fill in the form with the following details:
   - **Repository**: Select the repository to get the modules.
   - **TAG**: Select the type of commit action (e.g., FIX, ADD, IMP, etc.).
   - **Module**: Select the module within the repository.
   - **Short Description**: Enter a brief description of the changes made (maximum 80 characters).
   - **Long Description**: Enter a detailed description of the changes made (maximum 300 characters).
5. The commit message will be automatically written in the active terminal.
6. If no terminal is active, a warning message will appear.

## Update

In version 0.0.3 update the following was implemented:

1. Search of the repositories to obtain the modules of this one.
2. List all the modules of the selected repository.
