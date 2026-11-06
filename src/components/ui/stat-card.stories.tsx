import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatCard } from './stat-card'

const meta = {
  title: 'Data display/Stat Card',
  component: StatCard,
  args: { label: 'Kennedy', value: 103, trend: 'above' },
  argTypes: { trend: { control: 'select', options: ['above', 'about', 'below', 'low'] } },
  decorators: [(Story) => <div className="w-[200px]"><Story /></div>],
} satisfies Meta<typeof StatCard>
export default meta
type Story = StoryObj<typeof meta>

export const Above: Story = {}
export const About: Story = { args: { trend: 'about' } }
export const Below: Story = { args: { trend: 'below' } }
export const LowReporting: Story = { args: { trend: 'low' } }
export const Selected: Story = { args: { selected: true, onClick: () => {} } }
