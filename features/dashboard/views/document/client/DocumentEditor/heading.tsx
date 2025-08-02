import { type RenderElementProps } from 'slate-react'

const headingSizes = {
  h1: 'text-4xl',
  h2: 'text-3xl',
  h3: 'text-2xl',
  h4: 'text-xl',
  h5: 'text-lg',
  h6: 'text-base'
}

const alignmentClassMap = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right'
}

export function HeadingElement({
  attributes,
  children,
  element,
}: RenderElementProps & { element: { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; textAlign?: 'start' | 'center' | 'end' } }) {
  const Tag = `h${element.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const size = headingSizes[Tag]
  return (
    <Tag
      {...attributes}
      className={`${size} font-bold ${element.textAlign ? alignmentClassMap[element.textAlign] : ''}`}
    >
      {children}
    </Tag>
  )
}