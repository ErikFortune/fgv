/**
 * Tools for browse/detail view navigation.
 *
 * This namespace contains hooks for managing browse/detail view state
 * and URL hash navigation for deep linking.
 *
 * @example
 * ```tsx
 * import { BrowseTools } from '@fgv/ts-chocolate-ui';
 *
 * function MyTool() {
 *   const { state, actions } = BrowseTools.useBrowseDetailState<ItemId>();
 *   const { currentId, setId } = BrowseTools.useHashNavigation<ItemId>({
 *     prefix: 'items'
 *   });
 *
 *   // Sync hash to browse/detail state
 *   useEffect(() => {
 *     if (currentId) {
 *       actions.select(currentId);
 *     }
 *   }, [currentId, actions]);
 *
 *   if (state.viewMode === 'detail' && state.selectedId) {
 *     return <DetailView id={state.selectedId} onBack={actions.back} />;
 *   }
 *   return <BrowseView onSelect={actions.select} />;
 * }
 * ```
 *
 * @public
 */

export {
  useBrowseDetailState,
  type IBrowseDetailState,
  type IBrowseDetailActions,
  type IUseBrowseDetailStateResult
} from '../packlets/hooks';

export {
  useHashNavigation,
  type IHashNavigationOptions,
  type IUseHashNavigationResult
} from '../packlets/hooks';
