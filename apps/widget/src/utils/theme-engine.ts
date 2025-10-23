export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  headerColor?: string;
  headerTextColor?: string;
}

export interface ComponentTheme {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  boxShadow?: string;
}

export class ThemeEngine {
  private rootElement: HTMLElement | null = null;
  private appliedThemes: Map<string, ThemeConfig> = new Map();
  private componentStyles: Map<string, ComponentTheme> = new Map();

  constructor(rootSelector: string = '#tekassist-widget-root') {
    this.rootElement = document.querySelector(rootSelector);
    if (!this.rootElement) {
      console.warn(`ThemeEngine: Root element ${rootSelector} not found`);
    }
  }

  /**
   * Apply theme configuration using CSS variables
   */
  applyTheme(theme: ThemeConfig, themeId: string = 'default'): void {
    if (!this.rootElement) {
      console.warn('ThemeEngine: No root element found');
      return;
    }

    // Store the theme
    this.appliedThemes.set(themeId, theme);

    // Apply CSS variables
    const cssVariables: Record<string, string> = {
      '--tekassist-primary-color': theme.primaryColor || '#3B82F6',
      '--tekassist-secondary-color': theme.secondaryColor || '#EFF6FF',
      '--tekassist-background-color': theme.backgroundColor || '#FFFFFF',
      '--tekassist-text-color': theme.textColor || '#1F2937',
      '--tekassist-border-radius': theme.borderRadius || '8px',
      '--tekassist-font-family':
        theme.fontFamily || 'system-ui, -apple-system, sans-serif',
      '--tekassist-font-size': theme.fontSize || '14px',
      '--tekassist-button-color':
        theme.buttonColor || theme.primaryColor || '#3B82F6',
      '--tekassist-button-text-color': theme.buttonTextColor || '#FFFFFF',
      '--tekassist-header-color':
        theme.headerColor || theme.primaryColor || '#3B82F6',
      '--tekassist-header-text-color': theme.headerTextColor || '#FFFFFF',
    };

    // Apply variables to root element
    Object.entries(cssVariables).forEach(([property, value]) => {
      this.rootElement!.style.setProperty(property, value);
    });

    // Dispatch theme change event
    this.dispatchThemeChangeEvent(themeId, theme);
  }

  /**
   * Apply component-specific styles
   */
  applyComponentStyles(componentName: string, styles: ComponentTheme): void {
    this.componentStyles.set(componentName, styles);

    // Create or update component-specific CSS class
    const className = `tekassist-${componentName}`;
    let styleElement = document.getElementById(
      `tekassist-styles-${componentName}`,
    );

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = `tekassist-styles-${componentName}`;
      document.head.appendChild(styleElement);
    }

    const cssRules = Object.entries(styles)
      .map(([property, value]) => `${this.camelToKebab(property)}: ${value};`)
      .join(' ');

    styleElement.textContent = `.${className} { ${cssRules} }`;
  }

  /**
   * Get current theme configuration
   */
  getTheme(themeId: string = 'default'): ThemeConfig | null {
    return this.appliedThemes.get(themeId) || null;
  }

  /**
   * Get component styles
   */
  getComponentStyles(componentName: string): ComponentTheme | null {
    return this.componentStyles.get(componentName) || null;
  }

  /**
   * Remove theme
   */
  removeTheme(themeId: string = 'default'): void {
    this.appliedThemes.delete(themeId);

    if (themeId === 'default' && this.rootElement) {
      // Remove CSS variables
      const cssVariables = [
        '--tekassist-primary-color',
        '--tekassist-secondary-color',
        '--tekassist-background-color',
        '--tekassist-text-color',
        '--tekassist-border-radius',
        '--tekassist-font-family',
        '--tekassist-font-size',
        '--tekassist-button-color',
        '--tekassist-button-text-color',
        '--tekassist-header-color',
        '--tekassist-header-text-color',
      ];

      cssVariables.forEach(property => {
        this.rootElement!.style.removeProperty(property);
      });
    }
  }

  /**
   * Remove component styles
   */
  removeComponentStyles(componentName: string): void {
    this.componentStyles.delete(componentName);

    const styleElement = document.getElementById(
      `tekassist-styles-${componentName}`,
    );
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Clean up all themes and styles
   */
  cleanup(): void {
    this.appliedThemes.clear();

    // Remove all component style elements
    this.componentStyles.forEach((_, componentName) => {
      this.removeComponentStyles(componentName);
    });

    this.componentStyles.clear();

    // Remove theme variables from root element
    this.removeTheme('default');
  }

  /**
   * Generate CSS class name for component
   */
  getComponentClassName(componentName: string): string {
    return `tekassist-${componentName}`;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Dispatch theme change event
   */
  private dispatchThemeChangeEvent(themeId: string, theme: ThemeConfig): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('tekassist:theme-change', {
        detail: { themeId, theme },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Create theme preset
   */
  static createLightTheme(): ThemeConfig {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#EFF6FF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      buttonColor: '#3B82F6',
      buttonTextColor: '#FFFFFF',
      headerColor: '#3B82F6',
      headerTextColor: '#FFFFFF',
    };
  }

  /**
   * Create dark theme preset
   */
  static createDarkTheme(): ThemeConfig {
    return {
      primaryColor: '#60A5FA',
      secondaryColor: '#1E3A8A',
      backgroundColor: '#1F2937',
      textColor: '#F9FAFB',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      buttonColor: '#60A5FA',
      buttonTextColor: '#1F2937',
      headerColor: '#60A5FA',
      headerTextColor: '#1F2937',
    };
  }
}
