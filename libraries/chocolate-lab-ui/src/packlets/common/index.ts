/**
 * Common packlet - chocolate-lab-specific shared detail-view components.
 * @packageDocumentation
 */

export {
  NotesSection,
  type INotesSectionProps,
  UrlsSection,
  type IUrlsSectionProps,
  EntityDetailHeader,
  type IEntityDetailHeaderProps,
  type IEntityDetailHeaderBadge,
  type ICopyJsonOptions,
  copyJsonToClipboard,
  DerivedFromIndicator,
  type IDerivedFromIndicatorProps
} from './DetailCommon';

export { formatIngredientAmount, formatScaledIngredientAmount } from './formatHelpers';

export { groupByRole, type IIngredientGroup, type IGroupedItem } from './groupByRole';
export { RoleGroupHeader, type IRoleGroupHeaderProps } from './RoleGroupHeader';
export { InlineRoleLabel, type IInlineRoleLabelProps } from './InlineRoleLabel';
