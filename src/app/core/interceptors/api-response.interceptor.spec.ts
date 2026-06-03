import { HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiError } from '../models/api-response.model';

describe('apiResponseInterceptor', () => {
  let interceptor: ReturnType<typeof createInterceptor>;
  let nextFn: jest.Mock;

  function createInterceptor() {
    return jest.requireActual('./api-response.interceptor').apiResponseInterceptor;
  }

  beforeEach(() => {
    interceptor = createInterceptor();
    nextFn = jest.fn();
  });

  function createNext(responseBody: any): jest.Mock {
    const response = new HttpResponse({ body: responseBody });
    return jest.fn().mockReturnValue(new Observable<HttpEvent<unknown>>((sub) => {
      sub.next(response);
      sub.complete();
    }));
  }

  function collectEvents(obs: Observable<HttpEvent<unknown>>): Promise<HttpEvent<unknown>[]> {
    const events: HttpEvent<unknown>[] = [];
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (e) => events.push(e),
        error: (err) => reject(err),
        complete: () => resolve(events),
      });
    });
  }

  it('should pass through non-envelope responses unchanged', async () => {
    const req = new HttpRequest('GET', '/api/patients');
    nextFn = createNext({ id: '1', name: 'Test' });
    const events = await collectEvents(interceptor(req, nextFn) as Observable<HttpEvent<unknown>>);
    const body = (events[0] as HttpResponse<unknown>).body as any;
    expect(body.id).toBe('1');
  });

  it('should unwrap data from ApiResponse wrapper when isSuccess is true', async () => {
    const req = new HttpRequest('GET', '/api/patients');
    nextFn = createNext({ isSuccess: true, data: { id: '1', name: 'Test' }, message: 'OK' });
    const events = await collectEvents(interceptor(req, nextFn) as Observable<HttpEvent<unknown>>);
    const body = (events[0] as HttpResponse<unknown>).body as any;
    expect(body.id).toBe('1');
    expect(body.isSuccess).toBeUndefined();
  });

  it('should throw ApiError when isSuccess is false', async () => {
    const req = new HttpRequest('GET', '/api/patients');
    nextFn = createNext({
      isSuccess: false,
      message: 'Validation failed',
      errors: ['Name is required'],
    });
    try {
      await collectEvents(interceptor(req, nextFn) as Observable<HttpEvent<unknown>>);
      fail('Expected error to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).message).toBe('Validation failed');
    }
  });

  it('should skip auth endpoints: /api/auth/login', (done) => {
    const req = new HttpRequest('POST', '/api/auth/login');
    nextFn.mockReturnValue(new Observable((sub) => {
      sub.next(new HttpResponse({ body: { isSuccess: true, data: { token: 'abc' } } }));
      sub.complete();
    }));
    const result = interceptor(req, nextFn) as Observable<HttpEvent<unknown>>;
    result.subscribe({
      next: (event) => {
        const body = (event as HttpResponse<unknown>).body as any;
        expect(body.isSuccess).toBe(true);
        done();
      },
    });
  });

  it('should skip auth endpoints: /api/auth/refresh-token', (done) => {
    const req = new HttpRequest('POST', '/api/auth/refresh-token');
    nextFn.mockReturnValue(new Observable((sub) => {
      sub.next(new HttpResponse({ body: { isSuccess: true, data: { token: 'abc' } } }));
      sub.complete();
    }));
    const result = interceptor(req, nextFn) as Observable<HttpEvent<unknown>>;
    result.subscribe({
      next: (event) => {
        const body = (event as HttpResponse<unknown>).body as any;
        expect(body.isSuccess).toBe(true);
        done();
      },
    });
  });

  it('should skip auth endpoints: /api/auth/patient-login', (done) => {
    const req = new HttpRequest('POST', '/api/auth/patient-login');
    nextFn.mockReturnValue(new Observable((sub) => {
      sub.next(new HttpResponse({ body: { isSuccess: true, data: { token: 'abc' } } }));
      sub.complete();
    }));
    const result = interceptor(req, nextFn) as Observable<HttpEvent<unknown>>;
    result.subscribe({
      next: (event) => {
        const body = (event as HttpResponse<unknown>).body as any;
        expect(body.isSuccess).toBe(true);
        done();
      },
    });
  });
});
