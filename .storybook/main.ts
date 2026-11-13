import type { StorybookConfig } from '@storybook/react-vite'

// Storybook reuses vite.config.ts (the `@` alias and Tailwind), so stories render exactly like the app.
// Only components that do not import Supabase or read env (the same rule as the unit tests, docs/testing.md) get stories.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@chromatic-com/storybook'],
  framework: '@storybook/react-vite',
}
export default config
