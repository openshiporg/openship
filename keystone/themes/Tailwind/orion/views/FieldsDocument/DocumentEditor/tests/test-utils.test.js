/** @jest-environment jsdom */
/** @jsxRuntime classic */
/** @jsx jsx */
import { Editor } from  'slate'
import { makeEditor } from './utils';

test('basic cursor snapshot', () => {
  const editor = makeEditor(<editor>
    <paragraph>
      <text>
        <cursor />
      </text>
    </paragraph>
  </editor>)
  expect(editor).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            <cursor />
          </text>
        </paragraph>
      </editor>
    `)
})

test('editor equality match', () => {
  const editor = makeEditor(<editor>
    <paragraph>
      <text>
        <cursor />
      </text>
    </paragraph>
  </editor>)
  expect(editor).toEqualEditor(makeEditor(<editor>
    <paragraph>
      <text>
        <cursor />
      </text>
    </paragraph>
  </editor>))
})

test('editor equality mismatch', () => {
  expect(() =>
    expect(makeEditor(<editor>
      <paragraph>
        <text>
          some text
          <cursor />
        </text>
      </paragraph>
    </editor>)).toEqualEditor(makeEditor(<editor>
      <paragraph>
        <text>
          <cursor />
        </text>
      </paragraph>
    </editor>))).toThrowError()
})

test('cursor in the middle of text', () => {
  expect(makeEditor(<editor>
    <paragraph>
      <text>
        some
        <cursor />
        text
      </text>
    </paragraph>
  </editor>)).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            some
            <cursor />
            text
          </text>
        </paragraph>
      </editor>
    `)
})

test('cursor split in the same text', () => {
  expect(makeEditor(<editor>
    <paragraph>
      <text>
        some
        <anchor />
        text
        <focus />
      </text>
    </paragraph>
  </editor>)).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            some
            <anchor />
            text
            <focus />
          </text>
        </paragraph>
      </editor>
    `)
  expect(makeEditor(<editor>
    <paragraph>
      <text>
        some
        <focus />
        text
        <anchor />
      </text>
    </paragraph>
  </editor>)).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            some
            <focus />
            text
            <anchor />
          </text>
        </paragraph>
      </editor>
    `)
})

test('cursor split in different text', () => {
  expect(makeEditor(<editor>
    <paragraph>
      <text>
        some
        <anchor />
        text
      </text>
    </paragraph>
    <paragraph>
      <text>
        somete
        <focus />
        xt
      </text>
    </paragraph>
  </editor>)).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            some
            <anchor />
            text
          </text>
        </paragraph>
        <paragraph>
          <text>
            somete
            <focus />
            xt
          </text>
        </paragraph>
      </editor>
    `)
  expect(makeEditor(<editor>
    <paragraph>
      <text>
        some
        <focus />
        text
      </text>
    </paragraph>
    <paragraph>
      <text>
        somete
        <anchor />
        xt
      </text>
    </paragraph>
  </editor>)).toMatchInlineSnapshot(`
      <editor>
        <paragraph>
          <text>
            some
            <focus />
            text
          </text>
        </paragraph>
        <paragraph>
          <text>
            somete
            <anchor />
            xt
          </text>
        </paragraph>
      </editor>
    `)
})

test('throws on non-normalized input', () => {
  expect(() =>
    makeEditor(<editor>
      <paragraph>
        <paragraph>
          <text>
            some
            <cursor />
            text
          </text>
        </paragraph>
      </paragraph>
    </editor>)).toThrow()
})

test('allows non-normalized input when passed normalization: "skip"', () => {
  const editor = makeEditor(<editor>
    <paragraph>
      <paragraph>
        <text>
          some
          <cursor />
          text
        </text>
      </paragraph>
    </paragraph>
  </editor>, { normalization: 'skip' })
  expect(editor).toMatchInlineSnapshot(`
    <editor>
      <paragraph>
        <paragraph>
          <text>
            some
            <cursor />
            text
          </text>
        </paragraph>
      </paragraph>
    </editor>
  `)
  Editor.normalize(editor, { force: true })
  expect(editor).toMatchInlineSnapshot(`
    <editor>
      <paragraph>
        <text>
          some
          <cursor />
          text
        </text>
      </paragraph>
    </editor>
  `)
})

test('delete backward', () => {
  const editor = makeEditor(<editor>
    <paragraph>
      <text>
        some
        <cursor />
        text
      </text>
    </paragraph>
  </editor>)
  editor.deleteBackward('character')
  expect(editor).toMatchInlineSnapshot(`
    <editor>
      <paragraph>
        <text>
          som
          <cursor />
          text
        </text>
      </paragraph>
    </editor>
  `)
})

test('marks that conflict with .marks', () => {
  expect(() =>
    makeEditor(<editor>
      <paragraph>
        <text bold>
          some
          <cursor />
          text
        </text>
      </paragraph>
    </editor>)).toThrowError()
})

test('differing current marks', () => {
  const editor = makeEditor(<editor marks={{ bold: true }}>
    <paragraph>
      <text bold>
        some text
        <cursor />
      </text>
    </paragraph>
  </editor>)
  expect(editor).not.toEqualEditor(makeEditor(<editor marks={{}}>
    <paragraph>
      <text bold>
        some text
        <cursor />
      </text>
    </paragraph>
  </editor>))
})
