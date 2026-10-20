/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Defines the structure for a theme object.
 * The `colors` array corresponds to CSS variables:
 * [bg, surface, accent, text, document-bg]
 */
export type Theme = {
  name: string;
  colors: [string, string, string, string, string];
};

/**
 * An array of available themes for the application.
 */
export const themes: Theme[] = [
  {
    name: 'Glossy Candy Y2K',
    colors: ['#FFF5F8', '#FFFFFF', '#E6194B', '#2A0E17', '#FFFFFF'],
  },
  {
    name: 'Cherry Red & Chrome',
    colors: ['#FFE8EE', '#FFFFFF', '#D90429', '#1A040A', '#FFFFFF'],
  },
  {
    name: 'Cyber Candy (Dark)',
    colors: ['#1C1017', '#2A1723', '#FF2A6D', '#FFF0F5', '#160B12'],
  },
  {
    name: 'Rose Gold',
    colors: ['#fdf0f0', '#ffffff', '#e6a1a1', '#5c3a3a', '#ffffff'],
  },
  {
    name: 'Classic Light',
    colors: ['#d9d9df', '#e9e9ef', '#4285F4', '#202124', '#FFFFFF'],
  },
];
