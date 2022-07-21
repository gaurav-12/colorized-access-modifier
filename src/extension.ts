// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let timeout: NodeJS.Timer | undefined = undefined;
	const workbenchConfig = vscode.workspace.getConfiguration();
	const fullLine = workbenchConfig.get('colorized_access_modifier.colorizeFullLine') as boolean;
	const fontWeight = workbenchConfig.get('colorized_access_modifier.fontWeight') as string;

	// create a decorator type that we use to decorate private
	const privateDecorationType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: { id: 'colorized_access_modifier.privateBackground' },
		overviewRulerLane: vscode.OverviewRulerLane.Full,
		backgroundColor: { id: 'colorized_access_modifier.privateBackground' },
		color: { id: 'colorized_access_modifier.privateText' },
		fontWeight: fontWeight,
		isWholeLine: fullLine
	});

	const privateRulerLaneDecorationType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: { id: 'colorized_access_modifier.privateBackgroundRuler' },
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	const protectedDecorationType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: { id: 'colorized_access_modifier.protectedBackground' },
		overviewRulerLane: vscode.OverviewRulerLane.Full,
		backgroundColor: { id: 'colorized_access_modifier.protectedBackground' },
		color: { id: 'colorized_access_modifier.protectedText' },
		fontWeight: fontWeight,
		isWholeLine: fullLine
	});

	const protectedRulerLaneDecorationType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: { id: 'colorized_access_modifier.protectedBackgroundRuler' },
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	let activeEditor = vscode.window.activeTextEditor;
	let isRuby = activeEditor?.document.languageId === 'ruby';
	let isPhp = activeEditor?.document.languageId === 'php';

	function updateDecorations() {
		if (!activeEditor) {
			return;
		} else if(!isRuby && !isPhp) {
			activeEditor.setDecorations(privateDecorationType, []);
			activeEditor.setDecorations(privateRulerLaneDecorationType, []);
			activeEditor.setDecorations(protectedDecorationType, []);
			return;
		}

		if (isRuby) {
			const declarationRegex = /(^[^\S\r\n]*private$)|(^[^\S\r\n]*protected$)/gm;
			const privateRulerRegex = /private(\r\n|\r|\n)+(((?!^end)(?!.*protected).+)(\r\n|\r|\n)+)*/gm;
			const protectedRulerRegex = /protected(\r\n|\r|\n)+(((?!^end)(?!.*private).+)(\r\n|\r|\n)+)*/gm;
			const text = activeEditor.document.getText();

			const privatesMatches: vscode.DecorationOptions[] = [];
			const privateRulerMatches: vscode.DecorationOptions[] = [];
			const protectedMatches: vscode.DecorationOptions[] = [];
			const protectedRulerMatches: vscode.DecorationOptions[] = [];

			let match;
			while ((match = declarationRegex.exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

				if(match[0].trim() === 'private') {
					privatesMatches.push(decoration);
				} else {
					protectedMatches.push(decoration);
				}
			}

			
			while ((match = privateRulerRegex.exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };
				privateRulerMatches.push(decoration);
			}

			while ((match = protectedRulerRegex.exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };
				protectedRulerMatches.push(decoration);
			}

			activeEditor.setDecorations(privateDecorationType, privatesMatches);
			activeEditor.setDecorations(privateRulerLaneDecorationType, privateRulerMatches);
			activeEditor.setDecorations(protectedDecorationType, protectedMatches);
			activeEditor.setDecorations(protectedRulerLaneDecorationType, protectedRulerMatches);
		} else if (isPhp) {
			const declarationRegex = /([^\S\r\n]*private\s)|([^\S\r\n]*protected\s)/gm;
			const privateRulerRegex = /([^\S\r\n]*private\s)/gm;
			const protectedRulerRegex = /([^\S\r\n]*protected\s)/gm;
			const text = activeEditor.document.getText();

			const privatesMatches: vscode.DecorationOptions[] = [];
			const privateRulerMatches: vscode.DecorationOptions[] = [];
			const protectedMatches: vscode.DecorationOptions[] = [];
			const protectedRulerMatches: vscode.DecorationOptions[] = [];

			let match;
			while ((match = declarationRegex.exec(text))) {
				if (match.length < 0) {
					continue;
				}

				const val = match[0];
				if (val === null) {
					continue;
				}

				const spacesBefore = val.match(/^\s*/);
				let numberOfSpaceBefore = 0;
				if (spacesBefore !== null && spacesBefore.length > 0) {
					numberOfSpaceBefore = spacesBefore[0].length;
				}
				const spacesAfter = val.match(/\s*$/);
				let numberOfSpacesAfter = 0;
				if (spacesAfter !== null && spacesAfter.length > 0) {
					numberOfSpacesAfter = spacesAfter[0].length;
				}
				const startPos = activeEditor.document.positionAt(match.index + numberOfSpaceBefore);
				const endPos = activeEditor.document.positionAt(match.index + (match[0].length) - numberOfSpacesAfter);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

				if (match[0].trim() === 'private') {
					privatesMatches.push(decoration);
				} else {
					protectedMatches.push(decoration);
				}
			}

			while ((match = privateRulerRegex.exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };
				privateRulerMatches.push(decoration);
			}

			while ((match = protectedRulerRegex.exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration:vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };
				protectedRulerMatches.push(decoration);
			}

			activeEditor.setDecorations(privateDecorationType, privatesMatches);
			activeEditor.setDecorations(privateRulerLaneDecorationType, privateRulerMatches);
			activeEditor.setDecorations(protectedDecorationType, protectedMatches);
			activeEditor.setDecorations(protectedRulerLaneDecorationType, protectedRulerMatches);
		}
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}

		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor && (isRuby || isPhp)) {
		triggerUpdateDecorations();
	}


	// Code Listeners [START]

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		
		if (activeEditor) {
			isRuby = activeEditor.document.languageId === 'ruby';
			isPhp = activeEditor.document.languageId === 'php';

			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	// Called when Language mode for the document is changed
	// https://code.visualstudio.com/api/references/vscode-api#workspace
	vscode.workspace.onDidOpenTextDocument(document => {
		if (activeEditor) {
			isRuby = activeEditor.document.languageId === 'ruby';
			isPhp = activeEditor.document.languageId === 'php';

			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			isRuby = activeEditor.document.languageId === 'ruby';
			isPhp = activeEditor.document.languageId === 'php';

			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeActiveColorTheme(theme => {
		if (activeEditor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	// Code Listeners [END]
}

// This method is called when your extension is deactivated
export function deactivate() {}
