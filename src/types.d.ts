// Minimal rxjs type declarations for build
declare module 'rxjs' {
  export class Observable<T = any> {
    constructor(create?: (observer: any) => (() => void) | void);
    pipe(...operations: any[]): Observable<T>;
    subscribe(observer?: any): any;
  }
  export class Subject<T = any> extends Observable<T> {
    next(value: T): void;
    complete(): void;
    error(err: any): void;
  }
  export class BehaviorSubject<T = any> extends Subject<T> {
    constructor(value: T);
    getValue(): T;
  }
  export function firstValueFrom<T>(source: Observable<T>): Promise<T>;
  export function of<T>(...args: T[]): Observable<T>;
  export function from<T>(source: any): Observable<T>;
  export function throwError(error: any): Observable<never>;
  export function catchError<T, R>(fn: (err: any, caught: Observable<T>) => Observable<R>): (source: Observable<T>) => Observable<R>;
  export type ObservableInput<T> = Observable<T> | Promise<T> | Array<T>;
  export function forkJoin(sources: any): Observable<any>;
  export function debounceTime<T>(dueTime: number): (source: Observable<T>) => Observable<T>;
  export function distinctUntilChanged<T>(): (source: Observable<T>) => Observable<T>;
}

declare module 'rxjs/operators' {
  import { Observable } from 'rxjs';
  export function mergeMap<T, R>(fn: (value: T) => Observable<R>): (source: Observable<T>) => Observable<R>;
  export function catchError<T, R>(fn: (err: any, caught: Observable<T>) => Observable<R>): (source: Observable<T>) => Observable<R>;
  export function map<T, R>(fn: (value: T) => R): (source: Observable<T>) => Observable<R>;
  export function tap<T>(fn: (value: T) => void): (source: Observable<T>) => Observable<T>;
  export function debounceTime<T>(dueTime: number): (source: Observable<T>) => Observable<T>;
  export function distinctUntilChanged<T>(): (source: Observable<T>) => Observable<T>;
}
