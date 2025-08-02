import { type ReactNode, useState } from 'react'
import { type RenderLeafProps } from 'slate-react'
import { InsertMenu } from './insert-menu'

function Placeholder({ placeholder, children }: { placeholder: string; children: ReactNode }) {
  const [width, setWidth] = useState(0)
  return (
    <span className="relative inline-block" style={{ width }}>
      <span
        contentEditable={false}
        className="absolute pointer-events-none inline-block left-0 top-0 max-w-full whitespace-nowrap opacity-50 select-none not-italic font-normal no-underline text-left"
      >
        <span
          ref={node => {
            if (node) {
              const offsetWidth = node.offsetWidth
              if (offsetWidth !== width) {
                setWidth(offsetWidth)
              }
            }
          }}
        >
          {placeholder}
        </span>
      </span>
      {children}
    </span>
  )
}

const Leaf = ({ leaf, text, children, attributes }: RenderLeafProps) => {
  // Safety check: ensure we have valid text content
  if (!text || typeof text.text !== 'string') {
    console.warn('Invalid text node in Leaf component:', { leaf, text })
    // Return a safe fallback with empty string
    return <span {...attributes}></span>
  }

  // Safety check: ensure children is valid
  if (children === undefined || children === null) {
    console.warn('Invalid children in Leaf component:', { children, text })
    // Return with text content directly
    return <span {...attributes}>{text.text}</span>
  }

  const {
    underline,
    strikethrough,
    bold,
    italic,
    code,
    keyboard,
    superscript,
    subscript,
    placeholder,
    insertMenu,
  } = leaf

  if (placeholder !== undefined) {
    children = <Placeholder placeholder={placeholder}>{children}</Placeholder>
  }

  if (insertMenu) {
    children = <InsertMenu text={text}>{children}</InsertMenu>
  }

  if (code) {
    children = (
      <code
        className="bg-muted rounded-sm font-mono text-sm px-1 inline-block"
      >
        {children}
      </code>
    )
  }
  if (bold) {
    children = <strong>{children}</strong>
  }
  if (strikethrough) {
    children = <s>{children}</s>
  }
  if (italic) {
    children = <em>{children}</em>
  }
  if (keyboard) {
    children = <kbd>{children}</kbd>
  }
  if (superscript) {
    children = <sup>{children}</sup>
  }
  if (subscript) {
    children = <sub>{children}</sub>
  }
  if (underline) {
    children = <u>{children}</u>
  }
  return <span {...attributes}>{children}</span>
}

export const renderLeaf = (props: RenderLeafProps) => {
  // Check if we have the double-wrapped leaf issue
  const hasDoubleWrappedLeaf = props.leaf && (props.leaf as any).leaf

  if (hasDoubleWrappedLeaf) {
    // Create completely new props with fixed structure
    const fixedProps: RenderLeafProps = {
      ...props,
      leaf: (props.leaf as any).leaf,
      // Force children to be the text content to bypass Slate's broken String component
      children: props.text?.text || ''
    }

    return <Leaf {...fixedProps} />
  }

  // Ensure text node is valid for normal cases
  if (!props.text || typeof props.text.text !== 'string') {
    console.warn('Invalid text in renderLeaf:', props.text)
    const fixedProps = {
      ...props,
      text: { text: '' } as any,
      children: ''
    }
    return <Leaf {...fixedProps} />
  }

  return <Leaf {...props} />
}
