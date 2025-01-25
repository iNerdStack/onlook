import { makeAutoObservable } from 'mobx';
import type { PageNode } from '@onlook/models/pages';
import { invokeMainChannel } from '@/lib/utils';
import { MainChannels } from '@onlook/models/constants';
import type { EditorEngine } from '..';

export class PagesManager {
    private _tree: PageNode[] = [];
    private currentPath: string = '';

    constructor(private editorEngine: EditorEngine) {
        makeAutoObservable(this);
        this.init();
    }

    private async init() {
        await this.scanPages();
    }

    get tree() {
        return this._tree;
    }

    setPages(pages: PageNode[]) {
        this._tree = pages;
    }

    async scanPages() {
        try {
            const projectRoot = this.editorEngine.projectFolderPath;
            if (!projectRoot) {
                console.log('No project root found - make sure a project is selected');
                return;
            }

            console.log('Scanning pages from:', projectRoot);
            const pages = await invokeMainChannel<string, PageNode[]>(
                MainChannels.SCAN_PAGES,
                projectRoot,
            );

            if (!pages || !Array.isArray(pages)) {
                console.log('No valid pages array found');
                return;
            }

            this.setPages(pages);
            console.log('Pages loaded:', pages.length);
        } catch (error) {
            console.log('Failed to scan pages:', error);
            throw error;
        }
    }

    setCurrentPath(path: string) {
        this.currentPath = path;
        this.updateActiveStates(this.tree, path);
    }

    private updateActiveStates(nodes: PageNode[], activePath: string) {
        for (const node of nodes) {
            node.isActive = node.path === activePath;
            if (node.children) {
                this.updateActiveStates(node.children, activePath);
            }
        }
    }

    async navigateTo(path: string) {
        const webview = this.editorEngine.webviews.getActiveWebview();
        if (!webview) {
            console.log('No active webview found');
            return;
        }

        const baseUrl = this.editorEngine.projectInfo.baseUrl;
        await webview.loadURL(`${baseUrl}${path}`);
        this.setCurrentPath(path);
    }

    dispose() {
        this._tree = [];
        this.currentPath = '';
        this.editorEngine = null as any;
    }
}
