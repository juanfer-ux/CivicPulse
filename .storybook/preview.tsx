import type { Preview } from '@storybook/react-vite'
import { IconContext } from '@phosphor-icons/react'
import '../src/index.css'

// Same setup as src/main.tsx: the app's CSS (tokens, fonts, text styles) and bold Phosphor icons, on the app's dark background.
const preview: Preview = {
  decorators: [
    (Story) => (
      <IconContext.Provider value={{ weight: 'bold' }}>
        <Story />
      </IconContext.Provider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { options: { app: { name: 'App', value: '#111113' }, panel: { name: 'Panel', value: '#18181B' } } },
  },
  initialGlobals: { backgrounds: { value: 'app' } },
}
export default preview
