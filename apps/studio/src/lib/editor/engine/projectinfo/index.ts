import { makeAutoObservable } from 'mobx';
import type { ReactComponentDescriptor } from '/electron/main/code/components';

export class ProjectInfoManager {
    private projectComponents: ReactComponentDescriptor[];
    private _baseUrl: string = '';
    private _pagesDir: string = '';
    private _path: string = '';

    constructor() {
        makeAutoObservable(this);
        this.projectComponents = [];
    }

    get components() {
        return this.projectComponents;
    }

    set components(newComponents: ReactComponentDescriptor[]) {
        this.projectComponents = newComponents;
    }

    get baseUrl() {
        return this._baseUrl;
    }

    set baseUrl(url: string) {
        this._baseUrl = url;
    }

    get pagesDir() {
        return this._pagesDir;
    }

    set pagesDir(dir: string) {
        this._pagesDir = dir;
    }

    get path() {
        return this._path;
    }

    set path(value: string) {
        this._path = value;
    }
}
