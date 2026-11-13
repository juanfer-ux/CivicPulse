import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from '@phosphor-icons/react'
import { Button } from './button'

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const
const SIZES = ['sm', 'default', 'lg'] as const

const meta = {
  title: 'Actions & inputs/Button',
  component: Button,
  args: { children: 'Button' },
  argTypes: { variant: { control: 'select', options: VARIANTS }, size: { control: 'select', options: [...SIZES, 'icon', 'icon-lg'] } },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }

/** Every variant in every size, as in the Figma Button set. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v} className="flex flex-col gap-2">
          <p className="text-caption-medium text-(--neutral-200)">{v}</p>
          <div className="flex items-center gap-4">
            {SIZES.map((s) => (
              <Button key={s} variant={v} size={s}>
                Button
              </Button>
            ))}
            <Button variant={v} size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button variant={v} size="icon-lg" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
}
