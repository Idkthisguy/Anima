import QtQuick
import Anima.Backend

Item {
    required property var openFileDlg
    required property var saveFileDlg
    required property var confirmNewDlg
    required property var colorDialog
    required property var doSave

    Shortcut {
        sequence: "B"
        onActivated: MainEngine.tools.tool = 0
    }
    Shortcut {
        sequence: "E"
        onActivated: MainEngine.tools.tool = 1
    }
    Shortcut {
        sequence: "G"
        onActivated: MainEngine.tools.tool = 2
    }
    Shortcut {
        sequence: "I"
        onActivated: MainEngine.tools.tool = 3
    }
    Shortcut {
        sequence: "Ctrl+Z"
        onActivated: TL.undo()
    }
    Shortcut {
        sequence: "Ctrl+Y"
        onActivated: TL.redo()
    }
    Shortcut {
        sequence: "Ctrl+Shift+Z"
        onActivated: TL.redo()
    }
    Shortcut {
        sequence: "Delete"
        onActivated: TL.clearFrame()
    }
    Shortcut {
        sequence: "Space"
        onActivated: TL.togglePlay()
    }
    Shortcut {
        sequence: "Right"
        onActivated: TL.next()
    }
    Shortcut {
        sequence: "Left"
        onActivated: TL.prev()
    }
    Shortcut {
        sequence: "O"
        onActivated: TL.toggleOnionSkin()
    }
    Shortcut {
        sequence: "Ctrl+J"
        onActivated: TL.addFrame()
    }
    Shortcut {
        sequence: "Ctrl+O"
        onActivated: openFileDlg.open()
    }
    Shortcut {
        sequence: "Ctrl+S"
        onActivated: doSave()
    }
    Shortcut {
        sequence: "Ctrl+Shift+S"
        onActivated: saveFileDlg.open()
    }
    Shortcut {
        sequence: "Ctrl+N"
        onActivated: confirmNewDlg.open()
    }
}
