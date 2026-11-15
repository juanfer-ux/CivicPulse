import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { configure } from '@testing-library/dom'
import { afterEach } from 'vitest'

configure({ asyncUtilTimeout: 5000 })

afterEach(() => cleanup())

// jsdom has no ResizeObserver; Radix's Checkbox (inside a form) needs one.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
