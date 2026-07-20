import {
  captureSessionSetupGuideReturnHref,
  exitSessionSetupGuideToTrackEntry,
  getSessionSetupGuideReturnHref,
  getSessionSetupGuidePillProgress,
  getSessionSetupGuidePillProgressDefault,
  getSessionSetupGuideTotalPills,
  goToPreviousFromSessionSetupComplete,
  hrefFromStackRoute,
  resetSessionSetupGuideReturnHref,
  setSessionSetupGuideReturnHref,
} from './sessionSetupGuideNavigation';
import {
  isSessionCameraPermissionGranted,
  isSessionLocationPermissionGranted,
} from '@/utils/sessionPermissions';

jest.mock('@/utils/sessionPermissions', () => ({
  isSessionLocationPermissionGranted: jest.fn(),
  isSessionCameraPermissionGranted: jest.fn(),
}));

const mockLocationGranted = isSessionLocationPermissionGranted as jest.MockedFunction<
  typeof isSessionLocationPermissionGranted
>;
const mockCameraGranted = isSessionCameraPermissionGranted as jest.MockedFunction<
  typeof isSessionCameraPermissionGranted
>;

function mockPermissions(locationGranted: boolean, cameraGranted: boolean) {
  mockLocationGranted.mockResolvedValue(locationGranted);
  mockCameraGranted.mockResolvedValue(cameraGranted);
}

describe('getSessionSetupGuideTotalPills', () => {
  it('returns 10 when both permission screens remain', () => {
    expect(getSessionSetupGuideTotalPills(2)).toBe(10);
  });

  it('returns 8 when both permission screens are skipped', () => {
    expect(getSessionSetupGuideTotalPills(0)).toBe(8);
  });
});

describe('getSessionSetupGuidePillProgress', () => {
  it('keeps the guide on the first pill when permissions are already granted', async () => {
    mockPermissions(true, true);

    await expect(getSessionSetupGuidePillProgress('guide')).resolves.toEqual({
      total: 8,
      active: 1,
    });
  });

  it('advances one pill from step5 to free-hour when both permissions are skipped', async () => {
    mockPermissions(true, true);

    await expect(getSessionSetupGuidePillProgress('step5')).resolves.toEqual({
      total: 8,
      active: 5,
    });
    await expect(getSessionSetupGuidePillProgress('free-hour')).resolves.toEqual({
      total: 8,
      active: 6,
    });
  });

  it('uses the full 10-pill bar when both permissions are still ahead', async () => {
    mockPermissions(false, false);

    await expect(getSessionSetupGuidePillProgress('guide')).resolves.toEqual({
      total: 10,
      active: 1,
    });
    await expect(getSessionSetupGuidePillProgress('location')).resolves.toEqual({
      total: 10,
      active: 8,
    });
    await expect(getSessionSetupGuidePillProgress('camera')).resolves.toEqual({
      total: 10,
      active: 9,
    });
    await expect(getSessionSetupGuidePillProgress('complete')).resolves.toEqual({
      total: 10,
      active: 10,
    });
  });
});

describe('getSessionSetupGuidePillProgressDefault', () => {
  it('assumes both permissions are still ahead before the async check', () => {
    expect(getSessionSetupGuidePillProgressDefault('guide')).toEqual({
      total: 10,
      active: 1,
    });
  });
});

describe('hrefFromStackRoute', () => {
  it('maps index to home', () => {
    expect(hrefFromStackRoute({ name: 'index' })).toBe('/');
  });

  it('maps named routes and query params', () => {
    expect(hrefFromStackRoute({ name: 'shop' })).toBe('/shop');
    expect(hrefFromStackRoute({ name: 'session-detail', params: { id: 'abc' } })).toBe(
      '/session-detail?id=abc',
    );
  });
});

describe('captureSessionSetupGuideReturnHref', () => {
  beforeEach(() => {
    resetSessionSetupGuideReturnHref();
  });

  it('stores the route below the guide on the stack', () => {
    captureSessionSetupGuideReturnHref({
      index: 1,
      routes: [{ name: 'shop' }, { name: 'session-setup-guide' }],
    });

    expect(getSessionSetupGuideReturnHref()).toBe('/shop');
  });

  it('falls back to home when the guide is the root screen', () => {
    captureSessionSetupGuideReturnHref({
      index: 0,
      routes: [{ name: 'session-setup-guide' }],
    });

    expect(getSessionSetupGuideReturnHref()).toBe('/');
  });
});

describe('exitSessionSetupGuideToTrackEntry', () => {
  const dismissTo = jest.fn();
  const back = jest.fn();
  const canGoBack = jest.fn();
  const router = { dismissTo, back, canGoBack } as unknown as import('expo-router').Router;

  beforeEach(() => {
    dismissTo.mockClear();
    back.mockClear();
    canGoBack.mockClear();
    resetSessionSetupGuideReturnHref();
  });

  it('dismisses to the captured pre-Track screen', () => {
    setSessionSetupGuideReturnHref('/sessions-list');

    exitSessionSetupGuideToTrackEntry(router);

    expect(dismissTo).toHaveBeenCalledWith('/sessions-list');
    expect(back).not.toHaveBeenCalled();
  });

  it('falls back to guide back navigation when no return href was captured', () => {
    canGoBack.mockReturnValue(true);

    exitSessionSetupGuideToTrackEntry(router);

    expect(dismissTo).not.toHaveBeenCalled();
    expect(back).toHaveBeenCalled();
  });
});

describe('goToPreviousFromSessionSetupComplete', () => {
  const replace = jest.fn();
  const router = { replace } as unknown as import('expo-router').Router;

  beforeEach(() => {
    replace.mockClear();
  });

  it('targets camera permission when camera is not granted', async () => {
    mockPermissions(true, false);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-step7');
  });

  it('targets location permission when camera is granted but location is not', async () => {
    mockPermissions(false, true);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-setup-step6');
  });

  it('targets free-kit when both permissions were auto-skipped', async () => {
    mockPermissions(true, true);

    await goToPreviousFromSessionSetupComplete(router);

    expect(replace).toHaveBeenCalledWith('/session-free-kit');
  });
});
