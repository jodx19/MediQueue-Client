// Workaround: Angular build can't follow rxjs/operators subpath re-exports
// Provide direct re-exports from the internal type files
export { map, tap, catchError, switchMap, debounceTime, take, takeUntil, startWith, filter, finalize, concatMap, distinctUntilChanged } from 'rxjs/dist/types/internal/operators/index';
