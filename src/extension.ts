import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	const startCmd = vscode.commands.registerCommand('spaceRider.start', () => {
		SpaceRiderPanel.createOrShow(context, 'normal');
	});

	const debugCmd = vscode.commands.registerCommand('spaceRider.debug', () => {
		SpaceRiderPanel.createOrShow(context, 'debug');
	});

	context.subscriptions.push(startCmd, debugCmd);
}

export function deactivate() {}

class SpaceRiderPanel {
	public static currentPanel: SpaceRiderPanel | undefined;
	private static readonly viewType = 'spaceRider';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _context: vscode.ExtensionContext;
	private _disposables: vscode.Disposable[] = [];
	private _mode: string;

	public static createOrShow(context: vscode.ExtensionContext, mode: string = 'normal') {
		const column = vscode.ViewColumn.One;

		if (SpaceRiderPanel.currentPanel) {
			SpaceRiderPanel.currentPanel._panel.reveal(column);
			if (mode === 'debug') {
				SpaceRiderPanel.currentPanel._panel.webview.postMessage({ command: 'showDebugMenu' });
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			SpaceRiderPanel.viewType,
			'Space Rider',
			column,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'media')
				]
			}
		);

		SpaceRiderPanel.currentPanel = new SpaceRiderPanel(panel, context, mode);
	}

	private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, mode: string) {
		this._panel = panel;
		this._context = context;
		this._mode = mode;

		this._update();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'showScore':
						vscode.window.showInformationMessage(`Space Rider - Final Score: ${message.score}`);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		SpaceRiderPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const d = this._disposables.pop();
			if (d) {
				d.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		const gameHtmlPath = vscode.Uri.joinPath(this._context.extensionUri, 'media', 'game.html');
		let htmlContent = fs.readFileSync(gameHtmlPath.fsPath, 'utf8');
		if (this._mode === 'debug') {
			htmlContent = htmlContent.replace('<script>', '<script>window.__showDebugMenu = true;</script>\n<script>');
		}
		webview.html = htmlContent;
	}
}
