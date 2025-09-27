/**
 * TypeScript declarations for CSS Modules
 * Provides type safety for imported CSS module classes
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
