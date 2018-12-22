const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { shell } = require('electron')

describe('shell module', () => {
  const fixtures = path.resolve(__dirname, 'fixtures')
  const shortcutOptions = {
    target: 'C:\\target',
    description: 'description',
    cwd: 'cwd',
    args: 'args',
    appUserModelId: 'appUserModelId',
    icon: 'icon',
    iconIndex: 1
  }

  describe('shell.openExternal()', () => {
    it('opens an external link', function (done) {
      if (process.platform !== 'linux') this.skip()

      // set env vars for xdg-open
      const url = 'http://www.example.com'
      process.env.DE = 'generic'
      process.env.BROWSER = '/bin/true'
      process.env.DISPLAY = ''

      shell.openExternal(url).then(() => done())
    })
  })

  describe('shell.openExternalSync()', () => {
    it('opens an external link', function () {
      if (process.platform !== 'linux') this.skip()

      process.env.DE = 'generic'
      const tests = [
        { BROWSER: '/bin/true', expected: true },
        { BROWSER: '/bin/false', expected: false }
      ]

      for (const test of tests) {
        const { BROWSER, expected } = test
        process.env.DISPLAY = ''
        process.env.BROWSER = BROWSER
        const actual = shell.openExternalSync('http://www.example.com')
        assert.strictEqual(expected, actual)
      }
    })
  })

  describe('shell.readShortcutLink(shortcutPath)', () => {
    beforeEach(function () {
      if (process.platform !== 'win32') this.skip()
    })

    it('throws when failed', () => {
      assert.throws(() => {
        shell.readShortcutLink('not-exist')
      }, /Failed to read shortcut link/)
    })

    it('reads all properties of a shortcut', () => {
      const shortcut = shell.readShortcutLink(path.join(fixtures, 'assets', 'shortcut.lnk'))
      assert.deepStrictEqual(shortcut, shortcutOptions)
    })
  })

  describe('shell.writeShortcutLink(shortcutPath[, operation], options)', () => {
    beforeEach(function () {
      if (process.platform !== 'win32') this.skip()
    })

    const tmpShortcut = path.join(os.tmpdir(), `${Date.now()}.lnk`)

    afterEach(() => {
      fs.unlinkSync(tmpShortcut)
    })

    it('writes the shortcut', () => {
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, { target: 'C:\\' }), true)
      assert.strictEqual(fs.existsSync(tmpShortcut), true)
    })

    it('correctly sets the fields', () => {
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, shortcutOptions), true)
      assert.deepStrictEqual(shell.readShortcutLink(tmpShortcut), shortcutOptions)
    })

    it('updates the shortcut', () => {
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'update', shortcutOptions), false)
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'create', shortcutOptions), true)
      assert.deepStrictEqual(shell.readShortcutLink(tmpShortcut), shortcutOptions)
      const change = { target: 'D:\\' }
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'update', change), true)
      assert.deepStrictEqual(shell.readShortcutLink(tmpShortcut), Object.assign(shortcutOptions, change))
    })

    it('replaces the shortcut', () => {
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'replace', shortcutOptions), false)
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'create', shortcutOptions), true)
      assert.deepStrictEqual(shell.readShortcutLink(tmpShortcut), shortcutOptions)
      const change = {
        target: 'D:\\',
        description: 'description2',
        cwd: 'cwd2',
        args: 'args2',
        appUserModelId: 'appUserModelId2',
        icon: 'icon2',
        iconIndex: 2
      }
      assert.strictEqual(shell.writeShortcutLink(tmpShortcut, 'replace', change), true)
      assert.deepStrictEqual(shell.readShortcutLink(tmpShortcut), change)
    })
  })
})
