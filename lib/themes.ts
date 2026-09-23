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
    name: 'Cherry Pop (Y2K)',
    colors: ['#FFF5F7', '#FFFFFF', '#D90429', '#241417', '#FFFFFF'],
  },
  {
    name: 'Glossy Rose',
    colors: ['#FDF2F4', '#FFFFFF', '#FF3366', '#331B22', '#FFFFFF'],
  },
  {
    name: 'Midnight Cherry',
    colors: ['#1A1013', '#2B1A20', '#FF4D6D', '#FFF0F3', '#1F1317'],
  },
  {
    name: 'Light Classic',
    colors: ['#f4f4f7', '#ffffff', '#4285F4', '#202124', '#FFFFFF'],
  },
  {
    name: 'Dark Classic',
    colors: ['#202326', '#36393b', '#8AB4F8', '#E8EAED', '#1A1C1E'],
  },
  {
    name: 'Mint Chocolate',
    colors: ['#3d5a55', '#4f756f', '#a3d9d2', '#ffffff', '#4f756f'],
  },
  {
    name: 'Sunset',
    colors: ['#4c3a69', '#6e5d8d', '#f7b267', '#ffffff', '#6e5d8d'],
  },
];
