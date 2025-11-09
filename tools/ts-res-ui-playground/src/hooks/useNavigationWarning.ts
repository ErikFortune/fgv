import { useNavigationWarning as useNavigationWarningBase } from '@fgv/ts-res-ui-components';
import { Tool } from '../types/app';

// Type aliases for backwards compatibility
export type NavigationWarningState = import('@fgv/ts-res-ui-components').NavigationWarningState<Tool>;
export type NavigationWarningActions = import('@fgv/ts-res-ui-components').NavigationWarningActions<Tool>;

// Re-export the hook with proper typing
export const useNavigationWarning = (): {
  state: NavigationWarningState;
  actions: NavigationWarningActions;
} => {
  return useNavigationWarningBase<Tool>();
};
