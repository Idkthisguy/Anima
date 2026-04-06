import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Anima.Backend
import Anima.Components 1.0
import "./ui"
import "./ui/Viewport"
import "./ui/Dialogs"
import "./Timeline"

ApplicationWindow {
    id: root
    width: 1400
    height: 820
    minimumWidth: 900
    minimumHeight: 600
    visible: true
    color: "#0d0d0f"

    title: {
        var base = "Anima v2.0";
        if (IO.currentPath !== "") {
            var parts = IO.currentPath.replace(/\\/g, "/").split("/");
            base += "  —  " + parts[parts.length - 1];
        }
        return (IO.isDirty ? "* " : "") + base;
    }

    QtObject {
        id: pal
        readonly property color bg0: "#080809"
        readonly property color bg1: "#111113"
        readonly property color bg2: "#191b1e"
        readonly property color bg3: "#222428"
        readonly property color bg4: "#2c2f35"
        readonly property color acc: "#3d7dff"
        readonly property color accDim: "#1f3e80"
        readonly property color border: "#1e2025"
        readonly property color text: "#d4d4d8"
        readonly property color dim: "#606068"
        readonly property color red: "#e05252"
        readonly property color blue: "#5280e0"
        readonly property color green: "#27ae60"
    }

    Dialogs {
        id: dlg
        mainWindow: root
    }

    AppShortcuts {
        openFileDlg: dlg.openFileDlg
        saveFileDlg: dlg.saveFileDlg
        confirmNewDlg: dlg.confirmNewDlg
        colorDialog: colorPickerDlg
        doSave: dlg.doSave
    }

    ColorPickerDialog {
        id: colorPickerDlg
    }

    menuBar: MenuBar {
        background: Rectangle {
            color: pal.bg1
            border.color: pal.border
            border.width: 0
        }

        delegate: MenuBarItem {
            contentItem: Text {
                text: parent.text
                color: parent.highlighted ? pal.acc : pal.text
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg3 : "transparent"
                radius: 3
            }
        }
        Menu {
            title: "File"
            Action {
                text: "New Project"
                shortcut: "Ctrl+N"
                onTriggered: MainEngine.newProject()
            }
            Action {
                text: "Open…"
                shortcut: "Ctrl+O"
                onTriggered: appDialogs.openFileDlg.open()
            }
            MenuSeparator {}
            Action {
                text: "Save"
                shortcut: "Ctrl+S"
                onTriggered: appDialogs.doSave()
            }
            Action {
                text: "Save As…"
                shortcut: "Ctrl+Shift+S"
                onTriggered: appDialogs.saveFileDlg.open()
            }
            MenuSeparator {}
            Action {
                text: "Export GIF (COMING SOON)"
            }
            Action {
                text: "Export MP4 (COMING SOON)"
            }
            MenuSeparator {}
            Action {
                text: "Exit"
                onTriggered: Qt.quit()
            }
        }
        Menu {
            title: "Edit"
            Action {
                text: "Undo"
                shortcut: "Ctrl+Z"
                onTriggered: TL.undo()
            }
            Action {
                text: "Redo"
                shortcut: "Ctrl+Y"
                onTriggered: TL.redo()
            }
            MenuSeparator {}
            Action {
                text: "Clear Frame"
                shortcut: "Delete"
                onTriggered: TL.clearFrame()
            }
        }
        Menu {
            title: "Animation"
            Action {
                text: "Play / Pause"
                shortcut: "Space"
                onTriggered: TL.togglePlay()
            }
            Action {
                text: "Next Frame"
                shortcut: "Right"
                onTriggered: TL.next()
            }
            Action {
                text: "Prev Frame"
                shortcut: "Left"
                onTriggered: TL.prev()
            }
            Action {
                text: "Add Frame"
                shortcut: "Ctrl+J"
                onTriggered: TL.addFrame()
            }
        }
    }

    Menu {
        id: frameMenu
        property int targetIndex: 0

        background: Rectangle {
            color: pal.bg2
            border.color: pal.border
            border.width: 1
            radius: 4
        }

        MenuItem {
            text: "Duplicate"
            onTriggered: TL.duplicateFrame(frameMenu.targetIndex)
            contentItem: Text {
                text: parent.text
                color: pal.text
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }
        MenuItem {
            text: "Delete"
            onTriggered: TL.deleteFrame(frameMenu.targetIndex)
            contentItem: Text {
                text: parent.text
                color: pal.red
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }
        MenuItem {
            text: "Clear Content"
            onTriggered: {
                TL.goTo(frameMenu.targetIndex);
                TL.clearFrame();
            }
            contentItem: Text {
                text: parent.text
                color: pal.text
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }

        Dialogs {
            id: appDialogs
            mainWindow: root
        }
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Toolbar {
            Layout.fillHeight: true
            colorDialog: colorPickerDlg
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            Viewport {
                id: mainViewport
                Layout.fillWidth: true
                Layout.fillHeight: true
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: pal.acc
                opacity: .35
            }

            TimelinePanel {
                Layout.fillWidth: true
                height: 200
                frameMenu: frameMenu
            }
        }

        PropertiesPanel {
            width: 220
            Layout.fillHeight: true
            colorDialog: colorPickerDlg
        }
    }

    Item {
        id: customCursor

        x: globalPos.x - (width / 2)
        y: globalPos.y - (height / 2)

        width: 24
        height: 24

        visible: mainViewport.drawArea.containsMouse
        z: 999

        property point globalPos: mainViewport.drawArea.mapToItem(root.contentItem, mainViewport.drawArea.mouseX, mainViewport.drawArea.mouseY)

        Item {
            anchors.fill: parent
            visible: mainViewport.drawArea.containsMouse

            Rectangle {
                anchors.centerIn: parent
                width: 4
                height: 20
                color: "black"
            }
            Rectangle {
                anchors.centerIn: parent
                width: 20
                height: 4
                color: "black"
            }

            Rectangle {
                anchors.centerIn: parent
                width: 2
                height: 18
                color: "white"
            }
            Rectangle {
                anchors.centerIn: parent
                width: 18
                height: 2
                color: "white"
            }
        }

        /* Rectangle {
            anchors.fill: parent
            visible: drawArea.pressed

            radius: width / 2
            color: "transparent"

            border.color: "black"
            border.width: 2

            Rectangle {
                anchors.fill: parent
                anchors.margins: 1
                radius: width / 2
                color: "transparent"
                border.color: "white"
                border.width: 1
            }
        } */ //no drawing circle i guess
    }
}
