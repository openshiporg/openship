/** @jest-environment jsdom */
/** @jsxRuntime classic */
/** @jsx jsx */
import { shortcuts } from  './shortcuts'
import { makeEditor } from './tests/utils';

describe.each(Object.entries(shortcuts))('shortcut "%s" for "%s"', (shortcut, result) => {
  test('can be inserted', () => {
    const editor = makeEditor(<editor>
      <paragraph>
        <text>
          {shortcut}
          <cursor />
        </text>
      </paragraph>
    </editor>)

    editor.insertText(' ')
    expect(editor).toEqualEditor(makeEditor(<editor>
      <paragraph>
        <text>
          {result + ' '}
          <cursor />
        </text>
      </paragraph>
    </editor>))
  })
  test('the replacement can be undone', () => {
    const editor = makeEditor(<editor>
      <paragraph>
        <text>
          {shortcut}
          <cursor />
        </text>
      </paragraph>
    </editor>)

    editor.insertText(' ')
    expect(editor).toEqualEditor(makeEditor(<editor>
      <paragraph>
        <text>
          {result + ' '}
          <cursor />
        </text>
      </paragraph>
    </editor>))
    editor.undo()
    expect(editor).toEqualEditor(makeEditor(<editor>
      <paragraph>
        <text>
          {shortcut + ' '}
          <cursor />
        </text>
      </paragraph>
    </editor>))
  })
})
