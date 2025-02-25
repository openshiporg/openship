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

export function HeadingElement ({
  attributes,
  children,
  element
}) {
  const Tag = `h${element.level}`
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
